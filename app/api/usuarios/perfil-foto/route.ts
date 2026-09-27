import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "fotos-perfil";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

async function getAuthenticatedUser(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return jsonError("Sesión no válida o expirada.", 401);
    }

    const formData = await request.formData();
    const file = formData.get("foto") as File | null;

    if (!file) {
      return jsonError("No se recibió ninguna imagen.", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError("Tipo de imagen no permitido.", 400);
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return jsonError("La imagen debe tener un tamaño entre 1 byte y 8 MB.", 400);
    }

    const { data: usuarioDB, error: usuarioError } = await supabaseAdmin
      .from("usuarios")
      .select("id, foto_perfil_path")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (usuarioError) {
      console.error("ERROR BUSCANDO USUARIO PARA FOTO:", usuarioError);
      return jsonError("No se pudo verificar el usuario.", 500);
    }

    if (!usuarioDB) {
      return jsonError("No se encontró el usuario en RENALIX.", 404);
    }

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";

    const path = `${authUser.id}/perfil.${extension}`;

    // Elimina únicamente la foto anterior que pertenecía a este usuario.
    const previousPath = usuarioDB.foto_perfil_path;

    if (
      previousPath &&
      previousPath.startsWith(`${authUser.id}/`) &&
      previousPath !== path
    ) {
      const { error: removeError } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([previousPath]);

      if (removeError) {
        console.warn("NO SE PUDO ELIMINAR FOTO ANTERIOR:", removeError);
      }
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("ERROR SUBIENDO FOTO DE PERFIL:", uploadError);
      return jsonError("No se pudo guardar la foto de perfil.", 500);
    }

    const { error: updateError } = await supabaseAdmin
      .from("usuarios")
      .update({ foto_perfil_path: path })
      .eq("id", usuarioDB.id)
      .eq("auth_user_id", authUser.id);

    if (updateError) {
      console.error("ERROR GUARDANDO RUTA DE FOTO:", updateError);

      await supabaseAdmin.storage.from(BUCKET).remove([path]);

      return jsonError("No se pudo guardar la referencia de la foto.", 500);
    }

    const { data: signedData, error: signedError } =
      await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60);

    if (signedError || !signedData?.signedUrl) {
      console.error("ERROR GENERANDO URL FIRMADA:", signedError);
      return jsonError("La foto se guardó, pero no se pudo generar su vista.", 500);
    }

    return NextResponse.json({
      success: true,
      path,
      signedUrl: signedData.signedUrl,
    });
  } catch (error) {
    console.error("ERROR API PERFIL-FOTO POST:", error);
    return jsonError("Error interno del servidor.", 500);
  }
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return jsonError("Sesión no válida o expirada.", 401);
    }

    const { data: usuarioDB, error: usuarioError } = await supabaseAdmin
      .from("usuarios")
      .select("foto_perfil_path")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (usuarioError) {
      console.error("ERROR LEYENDO RUTA DE FOTO:", usuarioError);
      return jsonError("No se pudo consultar la foto de perfil.", 500);
    }

    const path = usuarioDB?.foto_perfil_path || "";

    if (!path) {
      return NextResponse.json({
        success: true,
        path: null,
        signedUrl: null,
      });
    }

    if (!path.startsWith(`${authUser.id}/`)) {
      return jsonError("La foto de perfil no pertenece al usuario autenticado.", 403);
    }

    const { data: signedData, error: signedError } =
      await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60);

    if (signedError || !signedData?.signedUrl) {
      console.error("ERROR GENERANDO URL DE FOTO:", signedError);
      return jsonError("No se pudo generar la vista de la foto.", 500);
    }

    return NextResponse.json({
      success: true,
      path,
      signedUrl: signedData.signedUrl,
    });
  } catch (error) {
    console.error("ERROR API PERFIL-FOTO GET:", error);
    return jsonError("Error interno del servidor.", 500);
  }
}
