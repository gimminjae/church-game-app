"use client"

import { useState } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [inputValue, setInputValue] = useState("")
  const router = useRouter()

  const handleSubmit = () => {
    if (inputValue.trim().toLowerCase() === "teacher") {
      Cookies.set("role", "teacher", { expires: 7 }) // 7일 유지
      router.push("/board-game")
    } else if (inputValue.trim().toLowerCase() === "minjae") {
      Cookies.set("role", "minjae", { expires: 7 }) // 7일 유지
      router.push("/board-game")
    } else {
      router.push("/board-game")
    }
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <h2>🧩 구리교회 보드게임 접속</h2>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="비밀번호 또는 역할을 입력하세요"
        style={{
          padding: "10px 15px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          fontSize: "16px",
          width: "250px",
          textAlign: "center",
        }}
      />
      <button
        onClick={handleSubmit}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          border: "none",
          borderRadius: "8px",
          backgroundColor: "#4caf50",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        입장하기
      </button>
    </div>
  )
}
