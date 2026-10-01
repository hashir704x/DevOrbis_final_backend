import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import type { Route } from "../../types/types.js";
import { leadNode } from "./nodes/lead-node.js";
import { tasksNode } from "./nodes/tasks-node.js";
import { ragNode } from "./nodes/rag-node.js";
import { generalTalkNode } from "./nodes/general-talk-node.js";
import { orchestratorNode } from "./nodes/orchestrator-node.js";

export const GraphState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (current, update) => current.concat(update),
        default: () => [],
    }),
    userId: Annotation<string>(),
    route: Annotation<Route>(),
});

function routeFromOrchestrator(state: typeof GraphState.State) {
    console.log("ROUTE NODE REACHED");
    console.log(state.route);
    switch (state.route) {
        case "rag":
            return "rag";

        case "tasks":
            return "tasks";

        case "lead":
            return "lead";

        case "general_talk":
            return "general_talk";

        default:
            console.log("Error in route node");
            throw new Error(`Unknown route: ${state.route}`);
    }
}

const graph = new StateGraph(GraphState)
    .addNode("orchestrator", orchestratorNode)
    .addNode("general_talk", generalTalkNode)
    .addNode("rag", ragNode)
    .addNode("tasks", tasksNode)
    .addNode("lead", leadNode)

    .addEdge(START, "orchestrator")
    .addConditionalEdges("orchestrator", routeFromOrchestrator, {
        rag: "rag",
        tasks: "tasks",
        lead: "lead",
        general_talk: "general_talk",
    })

    .addEdge("general_talk", END)
    .addEdge("rag", END)
    .addEdge("tasks", END)
    .addEdge("lead", END)

    .compile();

export { graph };
