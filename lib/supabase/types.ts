export type WiFiStatus = 'pending' | 'approved' | 'rejected'

export interface WiFi {
  id: string
  created_at: string
  name: string
  password: string
  latitude: number
  longitude: number
  status: WiFiStatus
  user_id: string | null
  updated_at?: string
}

export interface UserSubmissionLimit {
  user_id: string
  submission_count: number
  last_submission_at: string | null
  reset_at: string
}

export interface Report {
  id: string;
  created_at: string;
  wifi_id: string;
  user_id: string;
  reason: string;
  resolved: boolean;
  wifi: {
    name: string;
  };
}
