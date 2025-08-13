export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { code, language } = body || {};
    if (!code || typeof code !== 'string' || code.trim().length < 4) {
      return res.status(400).json({ error: 'Provide a "code" string (min 4 chars).' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY3;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY on server.' });

    //const model = "deepseek/deepseek-chat-v3-0324:free";
    //const model = "qwen/qwen3-coder:free";
    const model = "openai/gpt-oss-20b:free";
    const instructions = [
      "You are an expert algorithm complexity analyst.",
      "Analyze the provided code and return ONLY one JSON object with these keys: algorithmName, category, paradigm, primaryDataStructures, timeComplexity (bestCase, averageCase, worstCase), spaceComplexity, stable, inPlace, commonUseCases, bottlenecks, assumptions, possibleOptimizations, relatedAlgorithms, pseudocode, summary.",
      "General rules:",
      "1) Use standard Big-O/Θ notation (e.g., O(n log n), Θ(n·2^n)). Be precise with multiplicative factors when they come from necessary work (e.g., copying items, building outputs).",
      "2) Best/Average/Worst: If the algorithm does the same amount of work regardless of input distribution (no data-dependent early exit), report the SAME bound for all three. Do NOT use Best: O(1) unless there is an explicit, input-independent constant-time return.",
      "3) Output-sensitive work: When the algorithm enumerates or materializes results, express time as Θ(output_count × cost_per_item) and state that explicitly in the summary if it dominates.",
      "4) Space: Clearly distinguish auxiliary space (stack/temporary structures) from output storage. If output dominates, say so. Provide both in a single string.",
      "5) Stable: Only true if the algorithm preserves relative order of equal elements (relevant mainly to sorting). Otherwise false or empty.",
      "6) In-place: True only if extra space is O(1) beyond the input; recursion stack or buffers typically means not in-place.",
      "7) Bottlenecks: Mention the primary high-cost operations (e.g., nested loops, recursion depth, hashing/sorting, copying).",
      "8) Pseudocode: Short, language-agnostic, mirrors the core logic in the code.",
      "9) Summary: ≤ 220 words explaining what it does, how it works at a high level, and why the stated complexities hold.",
      '10) Unknown/NA fields must be "" or [].',
      "Return strictly valid JSON. No Markdown, no commentary."
    ].join('\\n');


    const userBlock = `Language: ${language || 'auto-detect'}\nCode:\n${code.slice(0, 60000)}`;

    const payload = {
      model,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: userBlock }
      ],
      temperature: 0.2,
    };

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-site-url.com",
        "X-Title": "Algorithm Complexity Analyzer"
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(502).json({ error: 'LLM upstream error', details: data });
    }

    const jsonText = data?.choices?.[0]?.message?.content?.trim();
    if (!jsonText) {
      return res.status(200).json({ ok: true, result: null, raw: '', warning: 'Empty model JSON text.' });
    }

    let parsed;
    try { parsed = JSON.parse(jsonText); }
    catch {
      const salvaged = extractJson(jsonText);
      if (!salvaged) return res.status(200).json({ ok: true, result: null, raw: jsonText, warning: 'Invalid JSON returned.' });
      try { parsed = JSON.parse(salvaged); }
      catch { return res.status(200).json({ ok: true, result: null, raw: jsonText, warning: 'Invalid JSON returned.' }); }
    }

    return res.status(200).json({ ok: true, result: parsed });

  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: String(err?.message || err) });
  }
}

function extractJson(s) {
  if (!s) return '';
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) return fenced[1].trim();
  const first = s.indexOf('{'), last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) return s.slice(first, last + 1).trim();
  return '';
}
