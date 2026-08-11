export type ShareOutcome = 'shared' | 'copied' | 'cancelled';

function legacyCopy(value: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

export async function shareResult(
  title: string,
  text: string,
  url: string,
): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  const value = `${text}\n${url}`;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
  } else if (!legacyCopy(value)) {
    throw new Error('Unable to copy share result.');
  }
  return 'copied';
}
