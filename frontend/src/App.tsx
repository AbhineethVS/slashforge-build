import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Health = {
  status: string
  openai_configured: boolean
}

function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState('')
  const [uploadResult, setUploadResult] = useState('')

  useEffect(() => {
    fetch('/api/v1/health')
      .then((response) => {
        if (!response.ok) throw new Error('Health request failed')
        return response.json() as Promise<Health>
      })
      .then(setHealth)
      .catch(() => setError('The API could not be reached.'))
  }, [])

  async function testUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUploadResult('Uploading…')
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/v1/spike/upload', {
      method: 'POST',
      body: form,
    })
    const result = await response.json()
    setUploadResult(
      response.ok
        ? `Accepted ${result.filename} (${result.size_bytes} bytes).`
        : result.detail,
    )
  }

  return (
    <main>
      <p className="eyebrow">LUMA · Phase 0</p>
      <h1>Combined deployment spike</h1>
      <p className="lede">
        This intentionally minimal page verifies that FastAPI serves the
        compiled React app and accepts a bounded multipart PDF upload.
      </p>

      <section aria-labelledby="health-heading">
        <h2 id="health-heading">Service health</h2>
        <p role="status">
          {error ||
            (health
              ? `API ${health.status}. OpenAI configuration is ${
                  health.openai_configured ? 'present' : 'not present'
                }.`
              : 'Checking the API…')}
        </p>
      </section>

      <section aria-labelledby="upload-heading">
        <h2 id="upload-heading">Multipart upload check</h2>
        <form onSubmit={testUpload}>
          <label htmlFor="pdf">Small test PDF</label>
          <input id="pdf" name="file" type="file" accept="application/pdf,.pdf" required />
          <button type="submit">Test upload</button>
        </form>
        <p role="status">{uploadResult}</p>
      </section>
    </main>
  )
}

export default App
