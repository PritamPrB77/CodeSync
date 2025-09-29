const axios = require('axios');

const JUDGE0_URL = process.env.JUDGE0_URL || '';
const JUDGE0_KEY = process.env.JUDGE0_KEY || '';

// Map simple language keys to Judge0 language IDs
// You can expand this list as needed.
const LANG_MAP = {
  javascript: 63, // Node.js
  python: 71, // Python 3
  java: 62, // Java (OpenJDK)
  cpp: 54 // C++ (GCC)
};

async function executeJudge0({ language, source, stdin = '' }) {
  if (!JUDGE0_URL) throw new Error('JUDGE0_URL is not configured');
  const language_id = LANG_MAP[language] || LANG_MAP.javascript;

  const base = JUDGE0_URL.replace(/\/$/, '');
  let headers = { 'Content-Type': 'application/json' };

  // Determine header scheme (RapidAPI vs direct Judge0)
  try {
    const host = new URL(base).host;
    const isRapid = host.endsWith('rapidapi.com');
    if (isRapid) {
      // RapidAPI requires these headers
      if (!JUDGE0_KEY) throw new Error('JUDGE0_KEY (RapidAPI Key) not set');
      headers['X-RapidAPI-Key'] = JUDGE0_KEY;
      headers['X-RapidAPI-Host'] = host; // e.g., judge0-ce.p.rapidapi.com
    } else if (JUDGE0_KEY) {
      // Self-hosted Judge0 optional auth
      headers['X-Auth-Token'] = JUDGE0_KEY;
    }
  } catch (_) {
    // If URL parsing fails, proceed without RapidAPI detection
    if (JUDGE0_KEY) headers['X-Auth-Token'] = JUDGE0_KEY;
  }

  const submitUrl = base + '/submissions?base64_encoded=false&wait=false';
  const body = { language_id, source_code: source, stdin };

  const submitRes = await axios.post(submitUrl, body, { headers });
  const token = submitRes.data?.token;
  if (!token) throw new Error('Failed to submit to Judge0');

  const fetchUrl = base + `/submissions/${token}?base64_encoded=false`;

  // poll until finished
  let attempts = 0;
  while (attempts < 30) {
    const r = await axios.get(fetchUrl, { headers });
    const status = r.data?.status?.id; // 1: in queue, 2: processing, >=3 done
    if (status >= 3) {
      return {
        stdout: r.data.stdout || '',
        stderr: r.data.stderr || '',
        compile_output: r.data.compile_output || '',
        time: r.data.time,
        memory: r.data.memory,
        status: r.data.status,
      };
    }
    await new Promise(res => setTimeout(res, 500));
    attempts++;
  }
  throw new Error('Execution timed out');
}

module.exports = { executeJudge0 };
