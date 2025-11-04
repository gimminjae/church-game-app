"use client"

import { Stage, Layer, Image, Group, Circle, Text } from "react-konva"
import useImage from "use-image"
import { useEffect, useState } from "react"
import { db } from "../firebase"
import { ref, onValue, set, update, remove } from "firebase/database"
import Cookies from "js-cookie"

interface Piece {
  id: string
  x: number
  y: number
  color: string
  number: number
}

export default function BoardGame() {
  const [boardImage] = useImage("/board.png")
  const [pieces, setPieces] = useState<Piece[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [stageSize, setStageSize] = useState({ width: 900, height: 700 })
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const handleResize = () => {
      const screenW = window.innerWidth
      const screenH = window.innerHeight

      // 원본 비율: 900 x 700
      const baseW = 900
      const baseH = 700

      // 가로 / 세로 비율 계산
      const widthRatio = screenW / baseW
      const heightRatio = screenH / baseH

      // 화면 비율에 맞는 스케일 계산 (가로/세로 중 작은 쪽 기준)
      const newScale = Math.min(widthRatio, heightRatio, 1)

      setScale(newScale)
      setStageSize({
        width: baseW * newScale,
        height: baseH * newScale,
      })
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
    }
  }, [])

  useEffect(() => {
    const userRole = Cookies.get("role")
    setRole(userRole || "guest")
  }, [])

  useEffect(() => {
    const piecesRef = ref(db, "pieces")
    const unsubscribe = onValue(piecesRef, (snapshot) => {
      const data = snapshot.val() || {}
      const newPieces = Object.values(data) as Piece[]
      newPieces.sort((a, b) => a.number - b.number)
      setPieces(newPieces)
    })
    return () => unsubscribe()
  }, [])

  const findNextNumber = () => {
    const usedNumbers = pieces.map((p) => p.number).sort((a, b) => a - b)
    let next = 1
    for (let n of usedNumbers) {
      if (n === next) next++
      else break
    }
    return next
  }

  const addPiece = async () => {
    if (role !== "teacher") {
      alert("교사만 말을 추가할 수 있습니다.")
      return
    }
    const id = `piece-${Date.now()}`
    const newNumber = findNextNumber()
    const newPiece: Piece = {
      id,
      number: newNumber,
      x: Math.random() * 700 + 50,
      y: Math.random() * 500 + 50,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    }
    await set(ref(db, `pieces/${id}`), newPiece)
  }

  const deletePiece = async (id: string) => {
    if (role !== "teacher") {
      alert("교사만 말을 삭제할 수 있습니다.")
      return
    }
    await remove(ref(db, `pieces/${id}`))
  }

  const handleDragEnd = async (id: string, x: number, y: number) => {
    if (role !== "teacher") return
    await update(ref(db, `pieces/${id}`), { x, y })
  }

  const RADIUS = 30
  const TEXT_SIZE = 30

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#111",
      }}
    >
      <h2
        style={{
          fontSize: 18 * scale,
          color: "white",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        🟢 구리교회 중고등부 부루마블 (실시간)
      </h2>

      {role === "minjae" ? (
        <button
          onClick={addPiece}
          style={{
            marginBottom: 10,
            padding: "8px 16px",
            fontSize: 14 * scale,
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#f4f4f4",
          }}
        >
          ➕ 말 추가
        </button>
      ) : (
        <p
          style={{
            color: "#ccc",
            marginBottom: 10,
            fontSize: 13 * scale,
          }}
        >
          👀 현재는 보기 전용 모드입니다.
        </p>
      )}

      <Stage
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        style={{
          borderRadius: 10,
          touchAction: "none",
          background: "#000",
        }}
      >
        <Layer>
          <Image image={boardImage} width={900} height={700} />

          {pieces.map((p) => (
            <Group
              key={p.id}
              x={p.x}
              y={p.y}
              draggable={role === "teacher"}
              onDragEnd={(e: any) =>
                handleDragEnd(p.id, e.currentTarget.x(), e.currentTarget.y())
              }
              onDblClick={() => {
                if (role === "teacher") deletePiece(p.id)
              }}
            >
              <Circle
                x={0}
                y={0}
                radius={RADIUS}
                fill={p.color}
                opacity={0.5}
                shadowBlur={6}
              />
              <Text
                text={`${p.number}`}
                x={-RADIUS}
                y={-TEXT_SIZE / 2}
                width={RADIUS * 2}
                align="center"
                fontSize={TEXT_SIZE}
                fontStyle="bold"
                fill="white"
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={0.6}
                listening={false}
              />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
