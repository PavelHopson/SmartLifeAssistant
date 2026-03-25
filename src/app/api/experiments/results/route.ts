import { NextResponse } from "next/server";
import { getExperimentResults } from "@/lib/services/experiment-results";

export async function GET() {
  const results = await getExperimentResults();
  return NextResponse.json({ results });
}
