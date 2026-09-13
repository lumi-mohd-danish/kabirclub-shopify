// site config
import { SITE_NAME } from '@/lib/constants';

/**
 * The year was hardcoded to 2025 and the brand was spelled three different
 * ways across the footer ("Kabir Club", "Kabirclub", "KabirClub"). Both come
 * from one source now: the clock, and SITE_NAME.
 */
const CopyRight = () => {
  return (
    <p className="num text-body-sm text-paper-muted">
      &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
    </p>
  );
};

export default CopyRight;
