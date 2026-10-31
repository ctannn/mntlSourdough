// Demo-only journal samples; never uploaded to the real blog table.
export function createDemoOvenPosts() {
  const now='2026-10-24T17:30:00.000Z';
  return [
    {id:'00000000-0000-4000-8000-000000008101',slug:'why-we-bake-slow',
      title:'Why We Bake Slow',category:'Behind the bake',
      excerpt:'A fictional example of a bakery journal entry, made for testing the editor.',
      body:'This is demo content only — it is not a real published MNTL article.\n\n## The long way round\n\nReal sourdough takes fermentation, practice, and patience. We use this sample to test the blog layout.\n\n- Mix\n- Rest\n- Bake with intention',
      cover_image_url:null,status:'published',published_at:now,created_at:now,updated_at:now},
    {id:'00000000-0000-4000-8000-000000008102',slug:'a-new-loaf-is-coming',
      title:'A New Loaf Is Coming',category:'Studio notes',
      excerpt:'A clearly labeled draft example for training.',
      body:'This demo draft stays private. Update the title or content and practice publishing without touching the live website.',
      cover_image_url:null,status:'draft',published_at:null,created_at:now,updated_at:now}
  ];
}
