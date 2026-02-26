import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPolarApiBaseUrl, getReturnBaseUrl } from "@/lib/polar/config";

export async function GET(req: Request) {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const { data: profile } = await (await supabase)
        .from("profiles")
        .select("polar_customer_id")
        .eq("id", user.id)
        .single();

    if (!profile?.polar_customer_id) {
        return NextResponse.json({ error: "Missing Polar customer id" }, { status: 400 });
    }

    const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
    if (!accessToken) {
        return NextResponse.json({ error: "POLAR_ACCESS_TOKEN is missing" }, { status: 500 });
    }

    const returnBaseUrl = getReturnBaseUrl(req.url);
    if (!returnBaseUrl) {
        return NextResponse.json({ error: "Missing app URL configuration" }, { status: 500 });
    }

    const polarApiBase = getPolarApiBaseUrl();
    const resp = await fetch(`${polarApiBase}/v1/customer-sessions/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            customer_id: profile.polar_customer_id,
            return_url: `${returnBaseUrl}/dashboard/billing`,
        }),
    });

    if (!resp.ok) {
        const text = await resp.text();
        return NextResponse.json({ error: text }, { status: 500 });
    }

    const data = await resp.json();

    return NextResponse.redirect(data.customer_portal_url);
}
