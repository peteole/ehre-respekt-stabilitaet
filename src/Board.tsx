import { useEffect, useReducer, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "./client";
import { Button, Input, Loading, Table, Tooltip } from "@nextui-org/react";
import { SelectPicker } from 'rsuite';
//import "./leaderboard.css"
import { TiDeleteOutline, TiPlus } from "react-icons/ti"


type Actor = { name: string, id: number }
type ActionVote = { action?: Action, voter: string, created_at: string, ehre: number, respekt: number, stabilitaet: number }
type Action = { id: number, description: string, actor: Actor, created_at: string }
async function from<T>(table: string) {
    const res = await supabase.from<T>(table)
}

export default function Board() {
    const authenticated = supabase.auth.user !== null
    const [name, setName] = useState("")
    const navigate = useNavigate()
    const [actors, setActors] = useState<Actor[]>([])
    const [actorName, setActorName] = useState("")
    const [newActionActorId, setNewActionActorId] = useState<number | null>(null)
    const [actions, setActions] = useState<Action[]>([])
    const id = useParams().id || 0;
    const [isLoading, setIsLoading] = useState(true)
    const [version, increase] = useReducer((s) => {
        return s + 1
    }, 0)
    const [editors, setEditors] = useState<{ email: string, board: number }[]>([])
    const [newActionDescription, setNewActionDescription] = useState("")
    const [newEditorEmail, setNewEditorEmail] = useState("")


    useEffect(() => {
        supabase.from<{ id: number, name: string, actors: Actor[],actions:Action[] }>('boards').select(`
            id,name, actors(id,name),actions(id,description,actor(id,name),created_at)
        `).eq('id', id).then(leaderboard => {
            console.log(leaderboard)
            if (!leaderboard?.data?.length) return
            setName(leaderboard.data[0].name)
            setActors(leaderboard.data[0].actors)
            setActions(leaderboard.data[0].actions)
            setIsLoading(false)
            //setPlayers(leaderboard?.data)
        })
        supabase.from<{ email: string, board: number }>("editors").select("email,board").eq("board", id).then(editors => {
            if (editors.data)
                setEditors(editors.data)
        })
    }, [version])

    if (isLoading)
        return <Loading size="md" />


    return (
        <div style={{ textAlign: "center" }} className="leaderboard">
            <h1>Ehre Respekt Stabilität {name}</h1>
            <h2>Leaderboard</h2>
            <Table
                aria-label="Players"
                css={{
                    height: "auto",
                    minWidth: "100%",
                }}>
                <Table.Header>
                    <Table.Column>Name</Table.Column>
                    <Table.Column>Ehre</Table.Column>
                    <Table.Column>Respekt</Table.Column>
                    <Table.Column>Stabilität</Table.Column>
                    <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body>
                    {actors.map((p) => (
                        <Table.Row>
                            <Table.Cell>{p.name}</Table.Cell>
                            <Table.Cell>0</Table.Cell>
                            <Table.Cell>0</Table.Cell>
                            <Table.Cell>0</Table.Cell>
                            <Table.Cell>
                                <Tooltip
                                    content="Delete player"
                                    color="error"
                                    onClick={async () => {
                                        await supabase.from('actors').delete().eq('id', p.id)
                                        increase()
                                    }}
                                >
                                    <IconButton>
                                        <TiDeleteOutline />
                                    </IconButton>
                                </Tooltip>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
            <h2>Add actor</h2>
            <p>
                <Input onChange={e => setActorName(e.target.value)} placeholder="New player name"
                    contentClickable
                    clearable
                    contentRight={<TiPlus />}
                    onContentClick={async (p, e) => {
                        await supabase.from("actors").insert({ name: actorName, board: id })
                        increase()
                    }}
                />

            </p>
            <h2>Add action</h2>
            <SelectPicker data={actors.map(a => ({
                label: a.name,
                value: a.id
            }))} label="Actor" value={newActionActorId} onChange={setNewActionActorId} />
            <Input onChange={e => setNewActionDescription(e.target.value)} placeholder="New action description"
                contentClickable
                clearable
                contentRight={<TiPlus />}
                onContentClick={async (p, e) => {
                    await supabase.from("actions").insert({ actor:newActionActorId, board: id ,description: newActionDescription })
                    increase()
                }} />

            <h2 style={{ marginTop: 50 }}>Actions</h2>
            <Table
                aria-label="Actions"
                css={{
                    height: "auto",
                    minWidth: "100%",
                }}>
                <Table.Header>
                    <Table.Column>Actor</Table.Column>
                    <Table.Column>Description</Table.Column>
                    <Table.Column>Date</Table.Column>
                    <Table.Column>Votes</Table.Column>
                    <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body>
                    {Array.from(actions).map((action, i) => (
                        <Table.Row>
                            <Table.Cell>{action.actor.name}</Table.Cell>
                            <Table.Cell>{action.description}</Table.Cell>
                            <Table.Cell>{new Date(action.created_at).toLocaleDateString()}</Table.Cell>
                            <Table.Cell>Vote</Table.Cell>
                            <Table.Cell>
                                <Tooltip
                                    content="Delete action"
                                    color="error"
                                    onClick={async () => {
                                        await supabase.from('actions').delete().eq('id', action.id)
                                        increase()
                                    }}
                                >
                                    <IconButton>
                                        <TiDeleteOutline />
                                    </IconButton>
                                </Tooltip>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
            <h2>Manage editors</h2>
            <p>
                <Input onChange={e => setNewEditorEmail(e.target.value)} placeholder="Editor email"
                    contentClickable
                    clearable
                    contentRight={<TiPlus />}
                    onContentClick={async (p, e) => {
                        await supabase.from("editors").insert({ email: newEditorEmail, board: id })
                        increase()
                    }}
                />

            </p>
            <Table
                aria-label="Editors"
                css={{
                    height: "auto",
                    minWidth: "100%",
                }}>
                <Table.Header>
                    <Table.Column>Email</Table.Column>
                    <Table.Column>Delete</Table.Column>
                </Table.Header>
                <Table.Body>
                    {
                        editors.map(e => (
                            <Table.Row>
                                <Table.Cell>{e.email}</Table.Cell>
                                <Table.Cell>
                                    <Tooltip
                                        content="Delete editor"
                                        color="error"
                                        onClick={async () => {
                                            await supabase.from('editors').delete().eq('email', e.email)
                                            increase()
                                        }}
                                    >
                                        <IconButton>
                                            <TiDeleteOutline />
                                        </IconButton>
                                    </Tooltip>
                                </Table.Cell>
                            </Table.Row>)
                        )
                    }
                </Table.Body>
            </Table>
            <Button
                color="warning"
                style={{ margin: "auto" }}
                onClick={async () => {
                    await supabase.from("leaderboards").delete().eq("id", id)
                    navigate("/")
                }}>Delete leaderboard</Button>
        </div>
    )
}

import { styled } from '@nextui-org/react';

// IconButton component will be available as part of the core library soon
export const IconButton = styled('button', {
    dflex: 'center',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    padding: '0',
    margin: '0',
    bg: 'transparent',
    transition: '$default',
    '&:hover': {
        opacity: '0.8'
    },
    '&:active': {
        opacity: '0.6'
    }
});

