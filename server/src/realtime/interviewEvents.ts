import { EventEmitter } from "events";

export type InterviewRealtimeEvent = {
  interviewId: string;
  type: string;
  payload?: unknown;
};

export const interviewEvents = new EventEmitter();

export const publishInterviewEvent = (event: InterviewRealtimeEvent) => {
  interviewEvents.emit(event.interviewId, event);
};

