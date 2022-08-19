import { FC, useEffect, useMemo, useReducer, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "./client";
import { Button, Input, Loading, Modal, Table, Text, Tooltip } from "@nextui-org/react";
import { SelectPicker } from 'rsuite';
import "./board.css"
import { TiDeleteOutline, TiPlus } from "react-icons/ti"

function dateCompare(a: { created_at: string }, b: { created_at: string }) {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}
type ScoreSet = { ehre: number, respekt: number, stabilitaet: number }

function sumScoreSets(a: ScoreSet, b: ScoreSet): ScoreSet {
    return { ehre: a.ehre + b.ehre, respekt: a.respekt + b.respekt, stabilitaet: a.stabilitaet + b.stabilitaet }
}
function scoreSum(a?: ScoreSet) {
    if (!a) return 0
    return a.ehre + a.respekt + a.stabilitaet
}
function scaleScoreSet(a: ScoreSet, scale: number): ScoreSet {
    if (!isFinite(scale))
        return a
    return { ehre: a.ehre * scale, respekt: a.respekt * scale, stabilitaet: a.stabilitaet * scale }
}

type Actor = { name: string, id: number }
type Voter = { username: string, id: string }
type ActionVote = { voter: Voter, created_at: string, ehre: number, respekt: number, stabilitaet: number }
type Action = { id: number, description: string, actor: Actor, created_at: string, action_votes: ActionVote[] }
async function from<T>(table: string) {
    const res = await supabase.from<T>(table)
}


export default function Board() {
    const authenticated = supabase.auth.user !== null
    const [name, setName] = useState("")
    const [actionVote, setActionVote] = useState<Action | null>(null)
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

    const [newEhre, setNewEhre] = useState("0")
    const [newRespect, setNewRespect] = useState("0")
    const [newStabilitaet, setNewStabilitaet] = useState("0")

    useEffect(() => {
        supabase.from<{ id: number, name: string, actors: Actor[], actions: Action[] }>('boards').select(`
            id,name, actors(id,name),actions(id,description,actor(id,name),created_at,action_votes(voter(username,id),created_at,ehre,respekt,stabilitaet))
        `).eq('id', id).then(leaderboard => {
            console.log(leaderboard)
            if (!leaderboard?.data?.length) return
            setName(leaderboard.data[0].name)
            setActors(leaderboard.data[0].actors)
            setActions(leaderboard.data[0].actions)
            setIsLoading(false)
        })
        supabase.from<{ email: string, board: number }>("editors").select("email,board").eq("board", id).then(editors => {
            if (editors.data)
                setEditors(editors.data)
        })
    }, [version])

    actions.sort(dateCompare)
    const scores=useMemo(()=>{
        const scores = new Map<number, ScoreSet>(actors.map(a => [a.id, { ehre: 0, respekt: 0, stabilitaet: 0 }]))
        for (const a of actions) {
            const scoresSum = a.action_votes.map(v => ({ ehre: v.ehre, respekt: v.respekt, stabilitaet: v.stabilitaet })).reduce(sumScoreSets, { ehre: 0, respekt: 0, stabilitaet: 0 })
            const averageScore = scaleScoreSet(scoresSum, 1 / a.action_votes.length)
            if (a.action_votes.some(v => v.voter.username.toLowerCase() === a.actor.name.toLowerCase() && (v.ehre > averageScore.ehre || v.respekt > averageScore.respekt || v.stabilitaet > averageScore.stabilitaet)))
                averageScore.ehre = averageScore.ehre - 1
            scores.set(a.actor.id, sumScoreSets(averageScore, scores.get(a.actor.id)!))
        }
        return scores
    },[actors,actions])
    
    actors.sort((a, b) => scoreSum(scores.get(b.id)) - scoreSum(scores.get(a.id)))
    const Vote: FC<{ vote: ActionVote, action: Action }> = props => {
        return (
            <div className="action-vote">
                <p>e={props.vote.ehre} r={props.vote.respekt} s={props.vote.stabilitaet}</p>
                <p>{props.vote.voter.username}</p>
                <Tooltip
                    content="Delete vote"
                    color="error"
                    style={{
                        position: "absolute",
                        top: 3,
                        right: 3,
                    }}
                    onClick={async () => {
                        await supabase.from('action_votes').delete().eq("action", props.action?.id).eq("voter", props.vote.voter.id)
                        increase()
                    }}
                >
                    <TiDeleteOutline color="red" />
                </Tooltip>
            </div>
        )
    }
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
                            <Table.Cell>{scores.get(p.id)?.ehre?.toFixed(1)}</Table.Cell>
                            <Table.Cell>{scores.get(p.id)?.respekt?.toFixed(1)}</Table.Cell>
                            <Table.Cell>{scores.get(p.id)?.stabilitaet?.toFixed(1)}</Table.Cell>
                            <Table.Cell>
                                <Tooltip
                                    content="Delete actor"
                                    color="error"
                                    onClick={async () => {
                                        if (!confirm("Are you sure you want to delete this actor?")) return
                                        await supabase.from('actors').delete().eq('id', p.id)
                                        increase()
                                    }}
                                >
                                    <TiDeleteOutline color="red" />
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
            <SelectPicker
                style={{ zIndex: 100 }}
                data={actors.map(a => ({
                    label: a.name,
                    value: a.id
                }))} label="Actor" value={newActionActorId} onChange={setNewActionActorId} />
            <Input onChange={e => setNewActionDescription(e.target.value)} placeholder="New action description"
                contentClickable
                clearable
                contentRight={<TiPlus />}
                onContentClick={async (p, e) => {
                    await supabase.from("actions").insert({ actor: newActionActorId, board: id, description: newActionDescription })
                    increase()
                }} />
            <Modal open={actionVote != null} closeButton onClose={() => setActionVote(null)}>
                <Modal.Header>
                    <Text>
                        Vote on action "{actionVote?.description}"
                    </Text>
                </Modal.Header>
                <Modal.Body>
                    <Input type="number" label="Ehre" onChange={e => setNewEhre(e.target.value)} initialValue="0" value={newEhre} />
                    <Input type="number" label="Respekt" onChange={e => setNewRespect(e.target.value)} initialValue="0" value={newRespect} />
                    <Input type="number" label="Stabilität" onChange={e => setNewStabilitaet(e.target.value)} initialValue="0" value={newStabilitaet} />
                    <Button onClick={async (e) => {
                        e.currentTarget.focus()
                        await supabase.from("action_votes").insert({ action: actionVote?.id, ehre: parseFloat(newEhre), respekt: parseFloat(newRespect), stabilitaet: parseFloat(newStabilitaet) })
                        increase()
                        setActionVote(null)
                    }}>Vote</Button>
                </Modal.Body>
            </Modal>
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
                    {actions.map((action) => (
                        <Table.Row>
                            <Table.Cell>{action.actor.name}</Table.Cell>
                            <Table.Cell><p style={{ overflowWrap: "break-word", maxWidth: "30vw", overflowX: "auto" }}>{action.description}</p></Table.Cell>
                            <Table.Cell>{new Date(action.created_at).toLocaleDateString()}</Table.Cell>
                            <Table.Cell>{action.action_votes.map(v => (<Vote vote={v} action={action} />))}</Table.Cell>
                            <Table.Cell>
                                <Tooltip
                                    content="Vote on action"
                                    color="secondary"
                                    onClick={async () => {
                                        setActionVote(action)
                                    }}
                                >
                                    <TiPlus color="purple" />
                                </Tooltip>

                                <Tooltip
                                    content="Delete action"
                                    color="error"
                                    onClick={async () => {
                                        if (!confirm("Are you sure you want to delete this action?")) return
                                        await supabase.from('actions').delete().eq('id', action.id)
                                        increase()
                                    }}
                                >
                                    <TiDeleteOutline color="red" />
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
                                        <TiDeleteOutline color="red" />
                                    </Tooltip>
                                </Table.Cell>
                            </Table.Row>)
                        )
                    }
                </Table.Body>
            </Table>
            <h2>Danger zone</h2>
            <Button
                color="warning"
                style={{ margin: "auto" }}
                onClick={async () => {
                    if (!confirm("Are you sure you want to delete this board?")) return
                    await supabase.from("boards").delete().eq("id", id)
                    navigate("/")
                }}>Delete leaderboard</Button>
        </div>
    )
}

