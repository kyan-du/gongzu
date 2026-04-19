import type { Env } from '../lib/env';
import { requireAdminAuth, unauthorizedResponse } from '../lib/auth';
import { handleQuizzes } from './admin/quizzes';
import { handleSubmissions } from './admin/submissions';
import { handlePendingRequests } from './admin/pending-requests';
import { handleBackup } from './admin/backup';
import { handleUpdateRequestStatus } from './admin/update-request-status';
import { handleResetDate } from './admin/reset-date';
import { handleRestore } from './admin/restore';
import { handleAssignQuiz } from './admin/assign-quiz';
import { handleRandomQuestions } from './admin/random-questions';
import { handleDeleteQuiz } from './admin/delete-quiz';

// GET /api/admin?action=quizzes&userId=cyan&date=2026-04-01
// GET /api/admin?action=submissions&userId=cyan&quizId=xxx
// DELETE /api/admin?action=delete-quiz&quizId=xxx
export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!requireAdminAuth(context.request, context.env)) {
    return unauthorizedResponse();
  }

  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');

  try {
    if (action === 'quizzes') {
      return await handleQuizzes(context);
    }

    if (action === 'submissions') {
      return await handleSubmissions(context);
    }

    if (action === 'pending-requests') {
      return await handlePendingRequests(context);
    }

    if (action === 'backup') {
      return await handleBackup(context);
    }

    return new Response(JSON.stringify({ error: 'Unknown action. Use: quizzes, submissions, pending-requests, backup' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST /api/admin - actions: reset-date (clear a specific date's data)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!requireAdminAuth(context.request, context.env)) {
    return unauthorizedResponse();
  }

  try {
    const body = await context.request.json() as Record<string, any>;
    const action = body.action;

    if (action === 'update-request-status') {
      return await handleUpdateRequestStatus(context, body);
    }

    if (action === 'reset-date') {
      return await handleResetDate(context, body);
    }

    if (action === 'restore') {
      return await handleRestore(context, body);
    }

    if (action === 'assign-quiz') {
      return await handleAssignQuiz(context, body);
    }

    if (action === 'random-questions') {
      return await handleRandomQuestions(context, body);
    }

    return new Response(JSON.stringify({ error: 'Unknown action. Use: update-request-status, reset-date, restore, assign-quiz, random-questions' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// DELETE /api/admin - delete quiz and its questions/submissions
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  if (!requireAdminAuth(context.request, context.env)) {
    return unauthorizedResponse();
  }

  try {
    return await handleDeleteQuiz(context);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
