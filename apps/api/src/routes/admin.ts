import type { FastifyInstance, FastifyPluginOptions, FastifyReply } from 'fastify';
import { parseRaListQuery } from '../lib/adminAuth';
import { assertSupervisor, requireAdmin } from '../lib/requireAdmin';
import {
  deleteAdminSpread,
  getAdminPayment,
  getAdminSpread,
  getAdminTicket,
  getAdminUser,
  listAdminPayments,
  listAdminSpreads,
  listAdminTickets,
  listAdminUsers,
  replyAdminTicket,
  updateAdminSpread,
  updateAdminTicketStatus,
  updateAdminUser,
} from '../services/adminService';

function sendList(
  reply: FastifyReply,
  resource: string,
  start: number,
  end: number,
  total: number,
  rows: unknown[]
) {
  const last = Math.max(start, Math.min(end, start + rows.length - 1));
  reply.header('Content-Range', `${resource} ${start}-${rows.length ? last : start}/${total}`);
  reply.header('X-Total-Count', String(total));
  reply.header('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count');
  return reply.send(rows);
}

export const adminRoute = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.get('/admin/me', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    return reply.send({ user: actor });
  });

  fastify.get('/admin/users', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    const parsed = parseRaListQuery(request.query as Record<string, unknown>);
    const { rows, total } = await listAdminUsers(parsed);
    return sendList(reply, 'users', parsed.start, parsed.end, total, rows);
  });

  fastify.get<{ Params: { id: string } }>('/admin/users/:id', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    const row = await getAdminUser(request.params.id);
    if (!row) {
      return reply.status(404).send({ message: 'User not found' });
    }
    return reply.send(row);
  });

  fastify.put<{
    Params: { id: string };
    Body: { name?: string; role?: string; spread_credits?: number };
  }>('/admin/users/:id', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    try {
      const row = await updateAdminUser(actor.role, request.params.id, request.body ?? {});
      if (!row) {
        return reply.status(404).send({ message: 'User not found' });
      }
      return reply.send(row);
    } catch (error) {
      if (error instanceof Error && error.name === 'SUPERVISOR_REQUIRED') {
        return reply.status(403).send({ message: 'Only supervisor can change roles' });
      }
      if (error instanceof Error && error.name === 'INVALID_ROLE') {
        return reply.status(400).send({ message: 'Invalid role' });
      }
      throw error;
    }
  });

  fastify.get('/admin/spreads', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    const parsed = parseRaListQuery(request.query as Record<string, unknown>);
    const { rows, total } = await listAdminSpreads(parsed);
    return sendList(reply, 'spreads', parsed.start, parsed.end, total, rows);
  });

  fastify.get<{ Params: { id: string } }>('/admin/spreads/:id', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    const row = await getAdminSpread(request.params.id);
    if (!row) {
      return reply.status(404).send({ message: 'Spread not found' });
    }
    return reply.send(row);
  });

  fastify.put<{
    Params: { id: string };
    Body: { question?: string | null; interpretation?: string | null; name?: string };
  }>('/admin/spreads/:id', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    const row = await updateAdminSpread(request.params.id, request.body ?? {});
    if (!row) {
      return reply.status(404).send({ message: 'Spread not found' });
    }
    return reply.send(row);
  });

  fastify.delete<{ Params: { id: string } }>('/admin/spreads/:id', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    if (!assertSupervisor(actor, reply)) {
      return;
    }
    await deleteAdminSpread(request.params.id);
    return reply.status(200).send({ id: request.params.id });
  });

  fastify.get('/admin/tickets', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    const parsed = parseRaListQuery(request.query as Record<string, unknown>);
    const { rows, total } = await listAdminTickets(parsed);
    return sendList(reply, 'tickets', parsed.start, parsed.end, total, rows);
  });

  fastify.get<{ Params: { id: string } }>('/admin/tickets/:id', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    const row = await getAdminTicket(request.params.id);
    if (!row) {
      return reply.status(404).send({ message: 'Ticket not found' });
    }
    return reply.send(row);
  });

  fastify.put<{
    Params: { id: string };
    Body: { status?: string; admin_reply?: string };
  }>('/admin/tickets/:id', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    const body = request.body ?? {};
    if (typeof body.admin_reply === 'string' && body.admin_reply.trim()) {
      const row = await replyAdminTicket(
        request.params.id,
        body.admin_reply,
        body.status
      );
      if (!row) {
        return reply.status(404).send({ message: 'Ticket not found' });
      }
      return reply.send(row);
    }
    if (typeof body.status === 'string') {
      const row = await updateAdminTicketStatus(request.params.id, body.status);
      if (!row) {
        return reply.status(404).send({ message: 'Ticket not found' });
      }
      return reply.send(row);
    }
    const existing = await getAdminTicket(request.params.id);
    if (!existing) {
      return reply.status(404).send({ message: 'Ticket not found' });
    }
    return reply.send(existing);
  });

  fastify.get('/admin/payments', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    const parsed = parseRaListQuery(request.query as Record<string, unknown>);
    const { rows, total } = await listAdminPayments(parsed);
    const mapped = rows.map((row) => ({
      ...row,
      id: row.invoice_id,
    }));
    return sendList(reply, 'payments', parsed.start, parsed.end, total, mapped);
  });

  fastify.get<{ Params: { id: string } }>('/admin/payments/:id', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) {
      return;
    }
    const row = await getAdminPayment(request.params.id);
    if (!row) {
      return reply.status(404).send({ message: 'Payment not found' });
    }
    return reply.send({ ...row, id: row.invoice_id });
  });
};
