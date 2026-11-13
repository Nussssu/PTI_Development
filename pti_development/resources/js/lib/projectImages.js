/* HD photos for the three projects the landing page features, matched by project name.
   Used wherever those projects appear outside the landing page (projects list, detail page). */
const HD_PROJECT_IMAGES = [
    [/airm[ae]n\s*tower/i, '/images/projects-hd/airman-tower.webp'],
    [/shopno\s*tower\s*-?\s*2\b/i, '/images/projects-hd/pti-shopno-tower-2.webp'],
    [/darul\s*fazle/i, '/images/projects-hd/darul-fazle-tower.webp'],
];

export function withHdImage(project) {
    const hit = HD_PROJECT_IMAGES.find(([re]) => re.test(project.name || ''));
    return hit ? { ...project, image_url: hit[1] } : project;
}
