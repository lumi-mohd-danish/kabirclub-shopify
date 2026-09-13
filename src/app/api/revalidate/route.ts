import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, secret } = body;

    // Fail closed. Comparing `undefined !== undefined` used to pass, so a
    // deployment that forgot REVALIDATE_SECRET let anyone purge any path.
    const expected = process.env.REVALIDATE_SECRET;
    if (!expected || typeof secret !== 'string' || secret !== expected) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    if (typeof path !== 'string' || !path.startsWith('/')) {
      return NextResponse.json({ message: 'No valid path provided' }, { status: 400 });
    }

    revalidatePath(path);
    return NextResponse.json({ message: `Revalidated ${path}` });
  } catch {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
