"use client";
import { useEffect, useRef } from "react";
import { AVATARS, TalkingAvatar, type AvatarEmotion, type AvatarStatus } from "@interviewflowai/talking-avatar";

export function Avatar({ emotion, status }: { emotion: AvatarEmotion; status: AvatarStatus }) {
  const host = useRef<HTMLDivElement>(null);
  const avatar = useRef<TalkingAvatar | null>(null);
  useEffect(() => {
    if (!host.current) return;
    const instance = new TalkingAvatar({ container: host.current, avatarUrl: "/avatars/yekta-female.glb", onError: () => {} });
    avatar.current = instance;
    return () => { avatar.current = null; instance.dispose(); };
  }, []);
  useEffect(() => { avatar.current?.setEmotion(emotion); avatar.current?.setStatus(status); }, [emotion, status]);
  return <div className="avatar-shell"><div className="avatar-aura" /><div ref={host} className="avatar-canvas" aria-label="Yekta's animated 3D portrait" role="img" /><div className="avatar-caption"><span className="avatar-status-dot" />{status === "thinking" ? "Finding the right words" : "Here with you"}</div></div>;
}
