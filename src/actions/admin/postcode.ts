'use server';
export async function getPostcodeDetailsAction(postcode: string): Promise<unknown> {
  const cleanPostcode = postcode.replace(/\D/g, '').slice(0, 6);
  if (cleanPostcode.length !== 6) {
    throw new Error('Valid 6-digit pincode is required');
  }
  try {
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/open/postcode/details?postcode=${encodeURIComponent(cleanPostcode)}`
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Shiprocket postcode lookup failed, falling back to India Post:', err);
  }
  const fallback = await fetch(
    `https://api.postalpincode.in/pincode/${encodeURIComponent(cleanPostcode)}`
  );
  if (fallback.ok) {
    return await fallback.json();
  }
  throw new Error('Unable to resolve postcode details');
}
