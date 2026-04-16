import { NextRequest, NextResponse } from 'next/server';
import { validateRfc69B } from '@/lib/sat/validation';
import { getSwitchSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  // Solo usuarios autenticados pueden consultar
  const session = await getSwitchSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rfc = req.nextUrl.searchParams.get('rfc');
  if (!rfc || rfc.length < 12 || rfc.length > 13) {
    return NextResponse.json({ error: 'RFC inválido' }, { status: 400 });
  }

  const result = await validateRfc69B(rfc);
  return NextResponse.json(result);
}
