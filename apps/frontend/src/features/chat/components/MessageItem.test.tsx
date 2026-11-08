import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { KVINTET_STARTED, type ChatMessage } from "@/features/chat/api/chatApi"

import { MessageItem } from "./MessageItem"

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }))

const system = (body: string): ChatMessage => ({
  id: 1,
  kind: "SYSTEM",
  authorId: null,
  authorName: null,
  authorUsername: null,
  body,
  createdAt: "2026-10-22T16:00:00.000Z",
})

describe("MessageItem system line", () => {
  it("translates the code the backend posts when a kvintet starts", () => {
    render(
      <MessageItem
        message={system(KVINTET_STARTED)}
        isOwn={false}
      />,
    )

    expect(screen.getByText("The kvintet has started. Say hello!")).toBeInTheDocument()
    expect(screen.queryByText(KVINTET_STARTED)).not.toBeInTheDocument()
  })

  it("shows a code it does not know as it is", () => {
    render(
      <MessageItem
        message={system("something_new")}
        isOwn={false}
      />,
    )

    expect(screen.getByText("something_new")).toBeInTheDocument()
  })
})
