import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "No está configurada GEMINI_API_KEY en las variables de entorno del servidor.",
        },
        { status: 500 }
      );
    }

    const datos = await req.json();

    const systemPrompt = `
Eres el asistente de generación de informes institucionales de RENALIX.

Tu tarea es redactar un INFORME DE SESIÓN Y ACUERDOS profesional, claro, formal y listo para revisión.

REGLAS OBLIGATORIAS:

- Usa exclusivamente los datos recibidos.
- NO inventes asistentes, nombres, cargos, votos, acuerdos, responsables, fechas, horarios, lugares ni decisiones.
- No atribuyas un acuerdo a una votación si los datos no establecen esa relación.
- Los resultados de votación deben coincidir exactamente con los conteos recibidos.
- Si un dato no existe, escribe "No registrado" o "Por definir", según corresponda.
- No incluyas estas reglas ni instrucciones en el informe final.
- No agregues una sección de "Reglas para la generación con IA".
- El documento debe terminar en "9. Firmas y validación".
- Mantén la trazabilidad: la redacción debe poder contrastarse con los datos proporcionados.
- El resumen ejecutivo y las conclusiones deben ser una síntesis fiel, no una invención.
- No uses lenguaje que afirme hechos que no estén registrados.
- Si no existen votaciones o acuerdos, indícalo expresamente.
- No conviertas una votación en "APROBADA" o "RECHAZADA" salvo que el resultado esté claramente sustentado por los datos disponibles.
- Si no hay una regla de aprobación explícita, describe únicamente los conteos.
`;

    const userPrompt = `
Genera el informe completo siguiendo exactamente esta estructura:

RENALIX
INFORME DE SESIÓN Y ACUERDOS

1. Identificación de la sesión
2. Objetivo de la sesión
3. Registro de asistencia
4. Temas tratados
5. Votaciones realizadas
6. Acuerdos adoptados
7. Resumen ejecutivo generado con IA
8. Conclusiones
9. Firmas y validación

DATOS REALES DE LA SESIÓN:

${JSON.stringify(datos, null, 2)}

INDICACIONES:

En "3. Registro de asistencia" presenta primero un resumen del total y luego los participantes registrados cuando estén disponibles.

En "4. Temas tratados" utiliza los puntos registrados y sus descripciones/resultados.

En "5. Votaciones realizadas" presenta cada pregunta y sus conteos de A FAVOR, EN CONTRA y ABSTENCIÓN.

En "6. Acuerdos adoptados" presenta los acuerdos registrados, sin inventar responsables o fechas que no existan.

En "7. Resumen ejecutivo generado con IA" redacta una síntesis profesional y breve basada exclusivamente en los datos.

En "8. Conclusiones" resume únicamente lo que puede concluirse de los registros.

En "9. Firmas y validación" deja espacios para:

Presidente de la Directiva

Secretario/a

Fecha de validación

Entrega solamente el informe final, sin explicaciones adicionales sobre tu proceso.
`;

    const promptCompleto = `${systemPrompt}

${userPrompt}`;

    let response: Response | null = null;

for (let intento = 1; intento <= 10; intento++) {
 response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: promptCompleto,
              },
            ],
          },
        ],
      }),
    }
  );

  if (response.ok || response.status < 500) {
    break;
  }

  if (intento < 3) {
    const espera = intento * 2000;
    console.log(
      `Gemini respondió ${response.status}. Reintentando en ${espera / 1000}s...`
    );
    await new Promise((resolve) => setTimeout(resolve, espera));
  }
}

    if (!response) {
  return NextResponse.json(
    {
      error: "No se recibió respuesta de Gemini.",
    },
    { status: 500 }
  );
}

const resultado = await response.json();

if (!response.ok) {
  
      console.error("Error Gemini:", resultado);

      return NextResponse.json(
        {
          error:
            resultado?.error?.message ||
            "Gemini no pudo generar el informe.",
        },
        { status: response.status || 500 }
      );
    }

    const informe =
      resultado?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part?.text || "")
        ?.join("\n")
        ?.trim() || "";

    if (!informe) {
      return NextResponse.json(
        {
          error: "Gemini no devolvió contenido para el informe.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ informe });
  } catch (error: any) {
    console.error("Error interno informe IA:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Ocurrió un error interno al generar el informe.",
      },
      { status: 500 }
    );
  }
}