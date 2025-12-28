// API callers for report endpoints

export interface CreateReportPayload {
  reportedEntityId: string;
  reportedEntityType: "post" | "comment" | "user" | "community";
  reason: string;
}

export const reportApi = {
  // Create a new report
  async create(
    payload: CreateReportPayload,
    userId: string
  ): Promise<{ report: any; message: string }> {
    const response = await fetch("/api/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to submit report");
    }

    return await response.json();
  },
};
