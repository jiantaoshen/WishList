export const API_BASE_URL = "";


export interface ScheduleStatus {
  taskExists: boolean;
  enabled: boolean;
  day: string;
  time: string;
  runIfMissed: boolean;
}


export interface ScheduleRequest {
  enabled: boolean;
  day: string;
  time: string;
  runIfMissed: boolean;
}


export async function fetchSchedule():
  Promise<ScheduleStatus> {

  const response =
    await fetch(
      `${API_BASE_URL}/api/schedule`,
      {
        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      `Failed to load schedule: ${response.status}`
    );
  }

  return response.json();
}


export async function saveSchedule(
  request: ScheduleRequest,
): Promise<ScheduleStatus> {

  const response =
    await fetch(
      `${API_BASE_URL}/api/schedule`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(request),
      }
    );

  if (!response.ok) {

    const text =
      await response.text();

    throw new Error(
      text ||
      `Failed to save schedule: ${response.status}`
    );
  }

  return response.json();
}


export async function deleteSchedule():
  Promise<void> {

  const response =
    await fetch(
      `${API_BASE_URL}/api/schedule`,
      {
        method: "DELETE",
      }
    );

  if (!response.ok) {
    throw new Error(
      `Failed to delete schedule: ${response.status}`
    );
  }
}