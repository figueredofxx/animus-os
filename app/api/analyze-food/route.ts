import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 })
  }

  let prompt = ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parts: any[] = []

  if (contentType.includes('multipart/form-data')) {
    // OCR mode — image uploaded
    const form = await req.formData()
    const image = form.get('image') as File | null
    const meal = form.get('meal') as string | null

    if (!image) return NextResponse.json({ error: 'Imagem não recebida' }, { status: 400 })

    const bytes = await image.arrayBuffer()
    const b64 = Buffer.from(bytes).toString('base64')
    const mime = image.type || 'image/jpeg'

    prompt = `Você é um nutricionista especialista em tabelas nutricionais brasileiras (TACO/IBGE).
Analise esta foto de refeição${meal ? ` (${meal})` : ''} e identifique todos os alimentos visíveis.
Estime as quantidades com base no tamanho visual dos itens e em porções típicas brasileiras.

Retorne SOMENTE um JSON válido (sem markdown):
{
  "name": "descrição resumida da refeição",
  "quantity": quantidade total estimada em gramas,
  "unit": "g",
  "kcal": calorias totais (inteiro),
  "protein": proteína em gramas (1 decimal),
  "carbs": carboidratos em gramas (1 decimal),
  "fat": gordura em gramas (1 decimal),
  "items": ["lista dos alimentos identificados"],
  "confidence": "high" | "medium" | "low",
  "notes": "observação sobre a estimativa"
}`

    parts = [
      { inline_data: { mime_type: mime, data: b64 } },
      { text: prompt },
    ]
  } else {
    // Text mode
    const { description } = await req.json()
    if (!description) return NextResponse.json({ error: 'Descrição vazia' }, { status: 400 })

    prompt = `Você é um nutricionista especialista em tabelas nutricionais brasileiras (TACO/IBGE).
O usuário descreveu: "${description}"

Retorne SOMENTE um JSON válido (sem markdown):
{
  "name": "nome padronizado",
  "quantity": quantidade em gramas (número),
  "unit": "g",
  "kcal": calorias totais (inteiro),
  "protein": proteína em gramas (1 decimal),
  "carbs": carboidratos em gramas (1 decimal),
  "fat": gordura em gramas (1 decimal),
  "items": ["ingredientes identificados"],
  "confidence": "high" | "medium" | "low",
  "notes": "observação opcional"
}`
    parts = [{ text: prompt }]
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 600 },
        }),
      }
    )
    if (!res.ok) throw new Error(`Gemini ${res.status}`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Falha ao analisar' }, { status: 500 })
  }
}
