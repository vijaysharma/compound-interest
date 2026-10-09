'use client';
import { useCallback, useRef, useState } from 'react';
import { getPostcodeDetailsAction } from '../../../actions/admin';
export interface PincodePlace {
  city: string;
  state: string;
}
/** City and state for a 6-digit Indian pincode, via the same lookup the create-order form uses. */
export async function lookupPincodePlace(pincode: string): Promise<PincodePlace | null> {
  const clean = pincode.replace(/\D/g, '');
  if (clean.length !== 6) return null;
  try {
    const raw = await getPostcodeDetailsAction(clean);
    const details = (raw as { postcode_details?: { city?: string; state?: string } } | null)
      ?.postcode_details;
    if (!details?.city) return null;
    return { city: details.city, state: details.state ?? '' };
  } catch {
    return null;
  }
}
/**
 * Fills city and state when the user types a full pincode. Call `onPincodeTyped` from the input's
 * change handler — not from an effect — so opening a saved address doesn't overwrite its city and
 * state. A slower earlier lookup never overwrites a newer one.
 */
export function usePincodeAutofill(apply: (place: PincodePlace) => void) {
  const [loading, setLoading] = useState(false);
  const latest = useRef('');
  const onPincodeTyped = useCallback(
    (pincode: string) => {
      const clean = pincode.replace(/\D/g, '');
      latest.current = clean;
      if (clean.length !== 6) return;
      setLoading(true);
      void lookupPincodePlace(clean).then((place) => {
        if (latest.current !== clean) return;
        setLoading(false);
        if (place) apply(place);
      });
    },
    [apply]
  );
  return { loading, onPincodeTyped };
}
