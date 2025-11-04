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

  useEffect(() => {
    const userRole = Cookies.get("role")
    setRole(userRole || "guest")
  }, [])

  // 실시간 구독
  useEffect(() => {
    const piecesRef = ref(db, "pieces")
    const unsubscribe = onValue(piecesRef, (snapshot) => {
      const data = snapshot.val() || {}
      const newPieces = Object.values(data) as Piece[]
      // 번호 순 정렬
      newPieces.sort((a, b) => a.number - b.number)
      setPieces(newPieces)
    })
    return () => unsubscribe()
  }, [])

  // 가장 작은 빈 번호 찾기
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

  const RADIUS = 30 // 반지름 (기존보다 1.5배)
  const TEXT_SIZE = 30 // 숫자 크기(더 큼)

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
      <div style={{ textAlign: "center" }}>
        <h2>🟢 구리교회 중고등부 부루마블 (실시간)</h2>

        {role === "teacher" ? (
          <button onClick={addPiece} style={{ marginBottom: 10 }}>
            ➕ 말 추가
          </button>
        ) : (
          <p style={{ color: "#666", marginBottom: 10 }}>
            👀 현재는 보기 전용 모드입니다.
          </p>
        )}

        <Stage width={900} height={700} style={{ margin: "auto" }}>
          <Layer>
            {/* 보드 이미지 */}
            <Image image={boardImage} width={900} height={700} />

            {/* 말 그룹으로 렌더링 */}
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
                {/* 말 (원) */}
                <Circle
                  x={0}
                  y={0}
                  radius={RADIUS}
                  fill={p.color}
                  opacity={0.5} // 투명도 적용
                  shadowBlur={6}
                />
                {/* 번호 텍스트: 그룹 내부에서 가운데 정렬, 텍스트는 포인터 이벤트 무시 */}
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
                  listening={false} // 텍스트가 드래그 등 이벤트를 가로채지 않음
                />
              </Group>
            ))}
          </Layer>
        </Stage>

        <p style={{ marginTop: 10, color: "#666" }}>
          💡 교사는 말을 추가/이동/삭제할 수 있고, 다른 사람은 보기만 가능합니다.
        </p>
      </div>
    </div>
  )
}
