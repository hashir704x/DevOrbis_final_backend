const create_task_n8n_url = process.env.N8N_CREATE_TASK_WEBHOOK_URL;
const update_task_n8n_url = process.env.N8N_UPDATE_TASK_WEBHOOK_URL;
const delete_task_n8n_url = process.env.N8N_DELETE_TASK_WEBHOOK_URL;

if (!create_task_n8n_url) {
    throw new Error("N8N_CREATE_TASK_WEBHOOK_URL is not defined");
}

if (!update_task_n8n_url) {
    throw new Error("N8N_UPDATE_TASK_WEBHOOK_URL is not defined");
}

if (!delete_task_n8n_url) {
    throw new Error("N8N_DELETE_TASK_WEBHOOK_URL is not defined");
}

export { create_task_n8n_url, update_task_n8n_url, delete_task_n8n_url };
