import type { FunctionDeclaration } from "@google/genai";

const getOrderHistory = {
    name: "get_order_history",
    description: "Fetch a customer's past orders, including dates, amounts, and status.",
    parametersJsonSchema: {
        type: "object",
        properties: {
            customer_id: { type: "string", description: "Unique customer identifier" },
        },
        required: ["customer_id"],
    },
};

const getOrderDetails = {
    name: "get_order_details",
    description: "Fetch details for a specific order, including items, shipping status, and delivery date.",
    parametersJsonSchema: {
        type: "object",
        properties: {
            order_id: { type: "string", description: "Unique order identifier" },
        },
        required: ["order_id"],
    },
};

const searchPolicyKb: FunctionDeclaration = {
    name: "search_policy_kb",
    description: "Search the store's refund/return policy knowledge base for relevant clauses.",
    parametersJsonSchema: {
        type: "object",
        properties: {
            query: { type: "string", description: "Search query, e.g. 'late delivery refund eligibility'" },
        },
        required: ["query"],
    },
};

const checkRefundEligibility = {
    name: "check_refund_eligibility",
    description: "Determine whether an order qualifies for a refund based on its status and the stated reason.",
    parametersJsonSchema: {
        type: "object",
        properties: {
            order_id: { type: "string", description: "Unique order identifier" },
            reason: { type: "string", description: "Customer's stated reason for the refund request" },
        },
        required: ["order_id", "reason"],
    },
};

const escalateToHuman = {
    name: "escalate_to_human",
    description: "Hand off the ticket to a human agent when the case can't be resolved automatically.",
    parametersJsonSchema: {
        type: "object",
        properties: {
            reason: { type: "string", description: "Why this case needs human review" },
        },
        required: ["reason"],
    },
};

// export { getOrderHistory, getOrderDetails, searchPolicyKb, checkRefundEligibility, escalateToHuman }
export const localTools = [getOrderHistory, getOrderDetails, searchPolicyKb, checkRefundEligibility, escalateToHuman]
