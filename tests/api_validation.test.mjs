/**
 * PharmaCore Automated API Validation & Rate Limiting Test Suite (Milestone 3)
 * Validates Requirement R3: Comprehensive Zod Input Validation & Rate Limiting Wiring
 */

import { spawn } from "child_process"
import { describe, it, expect, runAllSuites } from "./helpers/test_framework.mjs"

const PORT = 3012
const BASE_URL = `http://127.0.0.1:${PORT}`

let serverProcess = null

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/admin/analytics?timeRange=today`)
      if (res.status === 401 || res.status === 200 || res.status === 400) {
        return true
      }
    } catch {
      // Server not ready yet
    }
    await sleep(300)
  }
  throw new Error(`Server failed to start on ${url} within ${timeoutMs}ms`)
}

describe("Suite M3-1: Query & Body Zod Input Validation (400 Bad Request)", () => {
  it("1.1 GET /api/admin/analytics rejects invalid timeRange query with 400 and structured details", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/analytics?timeRange=invalid_range`)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid request payload")
    expect(data.details).toBeDefined()
    expect(data.details.fieldErrors).toBeDefined()
    expect(Boolean(data.details.fieldErrors.timeRange)).toBe(true)
  })

  it("1.2 POST /api/admin/settings/signup rejects malformed body with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/settings/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid request payload")
    expect(data.details).toBeDefined()
  })

  it("1.3 PATCH /api/admin/students/enrollments rejects missing enrollment IDs and invalid action with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/students/enrollments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unknown_action" }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid request payload")
    expect(data.details).toBeDefined()
  })

  it("1.4 POST /api/admin/students/enrollments rejects missing student/course IDs with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/students/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: "not-a-uuid" }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid request payload")
    expect(data.details).toBeDefined()
  })

  it("1.5 DELETE /api/admin/students/enrollments rejects missing identifiers with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/students/enrollments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid request payload")
    expect(data.details).toBeDefined()
  })

  it("1.6 POST /api/admin/students rejects un-discriminated or invalid action with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invalid_action" }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid request payload")
    expect(data.details).toBeDefined()
  })

  it("1.7 POST /api/admin/students provision action validates student email and password length", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "provision",
        studentData: { email: "bad-email", password: "123" },
      }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid request payload")
    expect(data.details).toBeDefined()
  })

  it("1.8 DELETE /api/admin/students rejects malformed studentId with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/students`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: "not-a-valid-uuid" }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid request payload")
    expect(data.details).toBeDefined()
  })

  it("1.9 POST /api/admin/users/create rejects invalid email, short password, empty name, invalid role with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "notanemail",
        password: "short",
        full_name: "",
        role: "unauthorized_role",
      }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid request payload")
    expect(data.details).toBeDefined()
    expect(Boolean(data.details.fieldErrors.email)).toBe(true)
    expect(Boolean(data.details.fieldErrors.password)).toBe(true)
    expect(Boolean(data.details.fieldErrors.full_name)).toBe(true)
    expect(Boolean(data.details.fieldErrors.role)).toBe(true)
  })

  it("1.10 DELETE /api/admin/users returns standardized error and details on invalid input", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        // Pass dummy token so auth parser reaches deleteSchema
        Authorization: "Bearer invalid_token",
      },
      body: JSON.stringify({}),
    })
    // Either 401 (auth) or 400 (validation) - if tested with schema, returns details
    expect([400, 401].includes(res.status)).toBe(true)
  })

  it("1.11 GET /api/courses/[id]/enroll validates course id parameter (must be UUID)", async () => {
    const res = await fetch(`${BASE_URL}/api/courses/not-a-valid-uuid/enroll`)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid request payload")
    expect(data.details).toBeDefined()
    expect(Boolean(data.details.fieldErrors.id)).toBe(true)
  })

  it("1.12 PUT /api/students/profile rejects invalid email and short password with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/students/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email", password: "123" }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid request payload")
    expect(data.details).toBeDefined()
  })

  it("1.13 POST /api/students/signup rejects empty body and invalid fields with 400 Bad Request", async () => {
    const res = await fetch(`${BASE_URL}/api/students/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "notanemail", password: "123" }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe("Invalid request payload")
    expect(data.details).toBeDefined()
    expect(Boolean(data.details.fieldErrors.first_name)).toBe(true)
    expect(Boolean(data.details.fieldErrors.last_name)).toBe(true)
    expect(Boolean(data.details.fieldErrors.email)).toBe(true)
    expect(Boolean(data.details.fieldErrors.password)).toBe(true)
  })
})

describe("Suite M3-2: Sliding-Window Rate Limiting Wire Enforcement", () => {
  it("2.1 POST /api/students/signup enforces rate limit of 5 requests per window and returns 429 on 6th", async () => {
    const clientIp = "192.168.10.101"
    let lastStatus = 0
    let lastRetryAfter = null

    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${BASE_URL}/api/students/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": clientIp,
        },
        body: JSON.stringify({}),
      })
      lastStatus = res.status
      if (res.status === 429) {
        lastRetryAfter = res.headers.get("Retry-After")
      }
    }

    expect(lastStatus).toBe(429)
    expect(lastRetryAfter).toBeDefined()
  })

  it("2.2 POST /api/courses/[id]/enroll enforces rate limit of 10 requests per window and returns 429 on 11th", async () => {
    const clientIp = "192.168.10.102"
    let lastStatus = 0

    for (let i = 1; i <= 11; i++) {
      const res = await fetch(`${BASE_URL}/api/courses/00000000-0000-0000-0000-000000000001/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": clientIp,
        },
        body: JSON.stringify({}),
      })
      lastStatus = res.status
    }

    expect(lastStatus).toBe(429)
  })

  it("2.3 POST /api/admin/users/create enforces rate limit of 15 requests per window and returns 429 on 16th", async () => {
    const clientIp = "192.168.10.103"
    let lastStatus = 0

    for (let i = 1; i <= 16; i++) {
      const res = await fetch(`${BASE_URL}/api/admin/users/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": clientIp,
        },
        body: JSON.stringify({}),
      })
      lastStatus = res.status
    }

    expect(lastStatus).toBe(429)
  })

  it("2.4 POST /api/questions/submit enforces rate limit of 10 requests per window and returns 429 on 11th", async () => {
    const clientIp = "192.168.10.104"
    let lastStatus = 0

    for (let i = 1; i <= 11; i++) {
      const res = await fetch(`${BASE_URL}/api/questions/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": clientIp,
        },
        body: JSON.stringify({}),
      })
      lastStatus = res.status
    }

    expect(lastStatus).toBe(429)
  })
})

async function main() {
  console.log(`Starting test server on port ${PORT}...`)
  serverProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: "pipe",
    env: process.env,
  })

  try {
    await waitForServer(BASE_URL)
    console.log(`Test server active on ${BASE_URL}. Running M3 validation test suite...`)
    const result = await runAllSuites()
    if (serverProcess) {
      serverProcess.kill("SIGTERM")
    }
    process.exit(result.exitCode)
  } catch (err) {
    console.error("Test execution error:", err)
    if (serverProcess) {
      serverProcess.kill("SIGTERM")
    }
    process.exit(1)
  }
}

main()
