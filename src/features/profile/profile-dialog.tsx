import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import type { AvatarOut, MembersPage, Session, User } from "../../api/types";
import { ErrorNotice, Modal } from "../../components/ui";
import { ActionButton } from "../../components/action-button";
import { FileUploadSurface } from "../../components/file-upload";
import { Avatar } from "./avatar";
import { validatePhoto } from "./photo-validation";
import "./profile.css";

export function ProfileDialog({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [draft, setDraft] = useState<{ file: File; url: string }>();
  const [operation, setOperation] = useState<
    "checking" | "saving" | "removing" | null
  >(null);
  const [error, setError] = useState<unknown>();
  const [status, setStatus] = useState("");
  const locked = useRef(false);
  const mounted = useRef(true);
  const selection = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      selection.current++;
    };
  }, []);
  useEffect(
    () => () => {
      if (draft) URL.revokeObjectURL(draft.url);
    },
    [draft],
  );

  const updatePhoto = async (photo: AvatarOut | null) => {
    const metadata = {
      avatar_url: photo?.avatar_url ?? null,
      avatar_version: photo?.avatar_version ?? null,
    };
    await Promise.all([
      client.cancelQueries({ queryKey: ["session"] }),
      client.cancelQueries({ queryKey: ["members"] }),
    ]);
    if (!mounted.current) return;
    client.setQueriesData<Session>({ queryKey: ["session"] }, (old) =>
      old?.user.id === user.id
        ? { ...old, user: { ...old.user, ...metadata } }
        : old,
    );
    client.setQueriesData<MembersPage>({ queryKey: ["members"] }, (old) =>
      old
        ? {
            ...old,
            items: old.items.map((member) =>
              member.id === user.id ? { ...member, ...metadata } : member,
            ),
          }
        : old,
    );
    void client.invalidateQueries({ queryKey: ["session"] });
    void client.invalidateQueries({ queryKey: ["members"] });
  };
  const choose = async (files: File[]) => {
    if (locked.current || !files.length) return;
    const current = ++selection.current;
    setError(undefined);
    setStatus("");
    if (files.length !== 1) {
      setError(new Error("Choose one profile photo at a time."));
      return;
    }
    locked.current = true;
    setOperation("checking");
    try {
      await validatePhoto(files[0]);
      if (mounted.current && current === selection.current)
        setDraft({ file: files[0], url: URL.createObjectURL(files[0]) });
    } catch (cause) {
      if (mounted.current && current === selection.current) setError(cause);
    } finally {
      locked.current = false;
      if (mounted.current && current === selection.current) setOperation(null);
    }
  };
  const save = async () => {
    if (locked.current || !draft) return;
    locked.current = true;
    setOperation("saving");
    setError(undefined);
    setStatus("");
    try {
      const photo = await api.saveAvatar(draft.file);
      await updatePhoto(photo);
      if (mounted.current) {
        setDraft(undefined);
        setStatus("Profile photo saved");
      }
    } catch (cause) {
      if (mounted.current) setError(cause);
    } finally {
      locked.current = false;
      if (mounted.current) setOperation(null);
    }
  };
  const remove = async () => {
    if (locked.current) return;
    locked.current = true;
    setOperation("removing");
    setError(undefined);
    setStatus("");
    try {
      await api.removeAvatar();
      await updatePhoto(null);
      if (mounted.current) {
        setDraft(undefined);
        setStatus("Profile photo removed. Your initials are shown instead.");
      }
    } catch (cause) {
      if (mounted.current) setError(cause);
    } finally {
      locked.current = false;
      if (mounted.current) setOperation(null);
    }
  };
  const busy = operation !== null;
  return (
    <Modal
      title="Profile & appearance"
      description="Choose the photo your team sees in WorkStation."
      onClose={onClose}
      busy={busy}
    >
      <div className="profile-editor">
        <div className="profile-identity">
          <Avatar
            name={user.display_name}
            url={user.avatar_url}
            className="profile-avatar-large"
            label="Current profile photo"
          />
          <div>
            <h3>{user.display_name}</h3>
            <p>{user.email}</p>
            <small>Your WorkStation photo</small>
          </div>
        </div>
        <FileUploadSurface
          onFiles={(files) => void choose(files)}
          accept=".jpg,.jpeg,.png,.webp"
          multiple={false}
          disabled={busy && operation !== "removing"}
          label="Choose profile photo"
          description="JPEG, PNG or WebP · up to 5 MiB · still images only"
        />
        {draft && (
          <figure className="profile-preview">
            <img src={draft.url} alt="Selected photo preview" />
            <figcaption>
              <strong>Preview</strong>
              <span>{draft.file.name}</span>
              <span>
                The saved photo is center-cropped to a square, up to 512 × 512
                pixels. Transparent areas become white.
              </span>
            </figcaption>
          </figure>
        )}
        {!draft && (
          <p className="profile-hint">
            Photos are center-cropped to a square. Transparent areas become
            white. Maximum 16 million pixels and 8,192 pixels per side.
          </p>
        )}
        <ErrorNotice error={error} />
        <p className="profile-status" role="status">
          {operation === "checking" ? "Checking photo…" : status}
        </p>
        <div className="profile-actions">
          {user.avatar_url && (
            <ActionButton
              className="button secondary"
              pending={operation === "removing"}
              disabled={busy}
              onClick={() => void remove()}
            >
              <Trash2 size={16} />
              Remove photo
            </ActionButton>
          )}
          {draft && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => {
                setDraft(undefined);
                setError(undefined);
              }}
            >
              Discard preview
            </button>
          )}
          <ActionButton
            className="button primary"
            pending={operation === "saving"}
            disabled={!draft || (busy && operation !== "saving")}
            onClick={() => void save()}
          >
            <Camera size={16} />
            Save photo
          </ActionButton>
        </div>
      </div>
    </Modal>
  );
}
