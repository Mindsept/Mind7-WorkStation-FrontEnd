import { useEffect, useState } from "react";
import { API_BASE, getContent } from "../../api/client";
import { initials } from "../../components/ui";

/** Only the documented authenticated image endpoint may supply profile bytes. */
export function avatarPath(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    if (
      url.origin !== window.location.origin ||
      url.username ||
      url.password ||
      !/^\/api\/v1\/members\/[a-f\d-]{36}\/avatar$/.test(url.pathname)
    )
      return null;
    return `${url.pathname.slice(API_BASE.length)}${url.search}`;
  } catch {
    return null;
  }
}

export function Avatar({
  name,
  url,
  className = "",
  label,
}: {
  name: string;
  url?: string | null;
  className?: string;
  label?: string;
}) {
  const path = avatarPath(url);
  const [image, setImage] = useState<{ path: string; url: string }>();
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    void getContent(path, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        if (!/^image\/(webp|png|jpeg)$/.test(blob.type))
          throw new Error("Invalid profile image");
        objectUrl = URL.createObjectURL(blob);
        setImage({ path, url: objectUrl });
        setFailed(null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(path);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);
  return (
    <span
      className={`avatar profile-avatar ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {path && image?.path === path && failed !== path ? (
        <img src={image.url} alt="" onError={() => setFailed(path)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
