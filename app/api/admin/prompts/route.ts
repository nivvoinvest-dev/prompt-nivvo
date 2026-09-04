import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function criarSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verificarAdmin(request: Request) {
  const supabaseAdmin = criarSupabaseAdmin();
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { autorizado: false, supabaseAdmin };
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user?.email) {
    return { autorizado: false, supabaseAdmin };
  }

  const { data: acesso, error: acessoError } = await supabaseAdmin
    .from("user_access")
    .select("active, role")
    .eq("email", user.email)
    .maybeSingle();

  if (
    acessoError ||
    !acesso ||
    acesso.active !== true ||
    acesso.role !== "admin"
  ) {
    return { autorizado: false, supabaseAdmin };
  }

  return { autorizado: true, supabaseAdmin };
}

export async function GET(request: Request) {
  try {
    const { autorizado, supabaseAdmin } = await verificarAdmin(request);

    if (!autorizado) {
      return NextResponse.json(
        { error: "Apenas administradores podem acessar os prompts." },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("prompts")
      .select(
        "id, title, description, content, category, active, image_url, video_url, media_type, created_at, updated_at"
      )
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prompts: data || [] });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao carregar prompts." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { autorizado, supabaseAdmin } = await verificarAdmin(request);

    if (!autorizado) {
      return NextResponse.json(
        { error: "Apenas administradores podem criar prompts." },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      content,
      category,
      active,
      image_url,
      video_url,
      media_type,
    } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Título e conteúdo são obrigatórios." },
        { status: 400 }
      );
    }

    const tipoMidia =
      media_type === "video" || media_type === "both" || media_type === "image"
        ? media_type
        : video_url && image_url
        ? "both"
        : video_url
        ? "video"
        : "image";

    const { data, error } = await supabaseAdmin
      .from("prompts")
      .insert({
        title,
        description: description || null,
        content,
        category: category || null,
        active: active ?? true,
        image_url: image_url || null,
        video_url: video_url || null,
        media_type: tipoMidia,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, prompt: data });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao criar prompt." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { autorizado, supabaseAdmin } = await verificarAdmin(request);

    if (!autorizado) {
      return NextResponse.json(
        { error: "Apenas administradores podem editar prompts." },
        { status: 403 }
      );
    }

    const {
      id,
      title,
      description,
      content,
      category,
      active,
      image_url,
      video_url,
      media_type,
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID do prompt é obrigatório." },
        { status: 400 }
      );
    }

    const alteracoes: Record<string, unknown> = {};

    if (title !== undefined) alteracoes.title = title;
    if (description !== undefined) alteracoes.description = description;
    if (content !== undefined) alteracoes.content = content;
    if (category !== undefined) alteracoes.category = category;
    if (active !== undefined) alteracoes.active = active;
    if (image_url !== undefined) alteracoes.image_url = image_url;
    if (video_url !== undefined) alteracoes.video_url = video_url;

    if (
      media_type === "image" ||
      media_type === "video" ||
      media_type === "both"
    ) {
      alteracoes.media_type = media_type;
    }

    const { data, error } = await supabaseAdmin
      .from("prompts")
      .update(alteracoes)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, prompt: data });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao editar prompt." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { autorizado, supabaseAdmin } = await verificarAdmin(request);

    if (!autorizado) {
      return NextResponse.json(
        { error: "Apenas administradores podem excluir prompts." },
        { status: 403 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID do prompt é obrigatório." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("prompts")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao excluir prompt." },
      { status: 500 }
    );
  }
}
