import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { description } = await req.json()

  if (!description) {
    return NextResponse.json({ error: 'Missing description' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  const prompt = `Você é um nutricionista especialista em tabelas nutricionais brasileiras (TACO, IBGE).
O usuário descreveu uma refeição ou alimento: "${description}"

Analise e retorne SOMENTE um JSON válido (sem markdown, sem explicações) com:
{
  "name": "nome padronizado do alimento/refeição",
  "quantity": quantidade em gramas ou ml (número),
  "unit": "g" ou "ml",
  "kcal": calorias totais (número inteiro),
  "protein": proteína em gramas (número com 1 decimal),
  "carbs": carboidratos em gramas (número com 1 decimal),
  "fat": gordura em gramas (número com 1 decimal),
  "confidence": "high" | "medium" | "low",
  "notes": "observação opcional sobre estimativa"
}

Regras:
- Use valores reais da tabela TACO para alimentos brasileiros
- Se quantidade não for informada, assuma porção típica (ex: 150g frango, 1 banana média=118g, etc)
- Calcule os macros para a quantidade TOTAL descrita, não por 100g
- Se for um prato composto, some os macros de todos os ingredientes
- Confidence: high = alimento comum com dados precisos, medium = estimativa razoável, low = prato complexo com muitas variáveis
- Retorne APENAS o JSON, sem nenhum texto adicional`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
        })
      }
    )

    if (!res.ok) {
      throw new Error(`Gemini error: ${res.status}`)
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Strip markdown if present
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json({ error: 'Failed to analyze food' }, { status: 500 })
  }
}
