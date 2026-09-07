import { NextRequest, NextResponse } from "next/server";
import { markMessageRead, deleteMessageById } from "@/lib/queries";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await markMessageRead(id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteMessageById(id);
  return NextResponse.json({ ok: true });
}
