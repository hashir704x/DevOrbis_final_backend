import { Router } from "express";
import { testError } from "../controllers/test.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

const router = Router();

router.get("/error", asyncHandler(testError));

// router.post(
//     "/test-n8n",
//     asyncHandler(async (req, res) => {
//         const response = await fetch(
//             "https://hashir704xdev.app.n8n.cloud/webhook-test/create-task",
//             {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                     id: "bf235ac5-c4a5-49a7-8c1f-f741555d3c03",
//                     title: "Testing Dashboard",
//                     description: "Create a proper testing dashboard for the client.",
//                     status: "completed",
//                     priority: "low",
//                     assignedTo: "d5d32bd3-f400-4e07-ba54-bca8be14fb96",
//                     assignedStaffName: "John Doe",
//                     leadId: "e44def57-8c2e-4998-b00b-3e7705874f8a",
//                     leadName: "Hashir Mahmood",
//                     leadEmail: "hashir704x@gmail.com",
//                     createdAt: new Date().toISOString(),
//                 }),
//             },
//         );

//         const data = await response.text();

//         return res.status(200).json(
//             new ApiResponse(true, "Request sent to n8n successfully", {
//                 n8nStatus: response.status,
//                 n8nResponse: data,
//             }),
//         );
//     }),
// );
export default router;
