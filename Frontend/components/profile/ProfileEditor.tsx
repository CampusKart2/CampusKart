"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Camera, X } from "lucide-react";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/lib/uploadthing";

type EditableProfileUser = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
};

interface ProfileEditorProps {
  initialUser: EditableProfileUser;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileEditor({ initialUser }: ProfileEditorProps) {
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(initialUser.full_name);
  const [avatarUrl, setAvatarUrl] = useState(initialUser.avatar_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploader = genUploader<OurFileRouter>();

  const initials = useMemo(() => initialsFromName(user.full_name), [user.full_name]);

  const cancelEdit = () => {
    setFullName(user.full_name);
    setAvatarUrl(user.avatar_url ?? "");
    setError(null);
    setIsEditing(false);
  };

  const saveProfile = async () => {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          avatar_url: avatarUrl,
        }),
      });

      const body = (await response.json()) as {
        user?: EditableProfileUser;
        error?: string;
      };

      if (!response.ok || !body.user) {
        setError(body.error ?? "Unable to update your profile.");
        return;
      }

      setUser(body.user);
      setFullName(body.user.full_name);
      setAvatarUrl(body.user.avatar_url ?? "");
      setIsEditing(false);
    } catch {
      setError("Unable to update your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setAvatarUploadError(null);

    if (!file.type.startsWith("image/")) {
      setAvatarUploadError("Choose an image file for your profile photo.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadedFiles = await uploader.uploadFiles("avatar", {
        files: [file],
      });
      const uploadedUrl = uploadedFiles[0]?.url;

      if (!uploadedUrl) {
        setAvatarUploadError("Unable to upload that profile photo.");
        return;
      }

      setAvatarUrl(uploadedUrl);
      setError(null);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error && uploadError.message.trim().length > 0
          ? uploadError.message
          : "Unable to upload that profile photo.";
      setAvatarUploadError(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <section className="rounded-card border border-border bg-card p-4 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-primary-light">
            {(isEditing ? avatarUrl : user.avatar_url) ? (
              // User-provided avatar URLs may be outside the configured Next Image domains.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={isEditing ? avatarUrl : user.avatar_url ?? ""}
                alt={`${user.full_name} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0 text-center sm:text-left">
            <h1 className="break-words text-2xl font-bold text-text-primary sm:text-3xl">
              {user.full_name}
            </h1>
            <p className="mt-1 break-words text-sm text-text-secondary">
              {user.email}
            </p>
          </div>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Edit profile
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-5 border-t border-border pt-5">
          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-text-primary">
                Full name
              </span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="min-h-11 rounded-input border border-border bg-white px-3 py-2 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                maxLength={100}
              />
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-text-primary">
                Profile photo
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                className="sr-only"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-button border border-border bg-card px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  {isUploadingAvatar ? "Uploading..." : "Upload photo"}
                </button>
                {avatarUrl ? (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    disabled={isUploadingAvatar}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-button border border-border bg-card px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Remove photo
                  </button>
                ) : null}
              </div>
              {avatarUploadError ? (
                <p className="text-sm font-medium text-danger">
                  {avatarUploadError}
                </p>
              ) : null}
            </div>

            <p className="text-sm text-text-muted">
              Your email is your .edu identifier and cannot be changed here.
            </p>

            {error ? (
              <p className="rounded-card border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={saveProfile}
                disabled={isSaving}
                className="inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isSaving}
                className="inline-flex min-h-11 items-center justify-center rounded-button border border-border bg-card px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
