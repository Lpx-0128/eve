"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useProfile() {
  const pathname = usePathname();
  const pathParts = pathname?.split('/').filter(Boolean) || [];
  const userIdSegment = pathParts[0] || '';
  
  const [profileName, setProfileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If there is no userId segment (e.g. at login), or it's a known generic route
    if (!userIdSegment || userIdSegment === 'login' || userIdSegment.length < 10) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        const res = await fetch(`/api/profile?userId=${userIdSegment}`);
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
        const json = await res.json();
        
        if (json.data && json.data.name) {
          setProfileName(json.data.name);
        } else {
          setProfileName(null);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userIdSegment]);

  return { profileName, loading, userIdSegment };
}
