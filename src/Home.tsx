import { useEffect, useReducer, useState } from "react"
import { supabase } from "./client"
import { Outlet, Link } from "react-router-dom";
import { Button, Input } from "@nextui-org/react";
import { TiPlus } from "react-icons/ti"

export default function Home() {
    const [boards, setBoards] = useState<{ id: number, name: string }[]>([])
    const [leaderboardName, setLeaderboardName] = useState("")
    const [version, increase] = useReducer((s) => {
        return s + 1
    }, 0)
    useEffect(() => {
        supabase.from<{ id: number, name: string }>("boards").select("*").then(boards => {
            console.log(boards)
            if (!boards?.data?.length) return
            setBoards(boards.data)
        })
    }, [version])
    return (
        <div>
            <h1>Ehre Respekt Stabilität</h1>
            {
                boards.map(l => {
                    return <p><Link to={`/boards/${l.id}`}>{l.name}</Link></p>
                }
                )
            }
            <h2>Create board</h2>
            <Input onChange={e => setLeaderboardName(e.target.value)} placeholder="New board name" contentClickable contentRight={<TiPlus/>} onContentClick={async () => {
                await supabase.from("boards").insert({ name: leaderboardName })
                increase()
            }}/>

        </div>)
}