import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // console.log('Seeding database...');

  // Create some ArXiv papers
  const papers = [
    {
      title: 'Attention Is All You Need',
      author_or_creator: 'Ashish Vaswani et al.',
      type: 'journal_paper' as const,
      description: 'The paper that introduced the Transformer architecture.',
      external_url: 'https://arxiv.org/abs/1706.03762',
      platform_name: 'ArXiv',
      tags: ['LLM', 'Transformers', 'Foundational'],
    },
    {
      title: 'LoRA: Low-Rank Adaptation of Large Language Models',
      author_or_creator: 'Edward J. Hu et al.',
      type: 'journal_paper' as const,
      description: 'An efficient adaptation strategy that does not introduce inference latency.',
      external_url: 'https://arxiv.org/abs/2106.09685',
      platform_name: 'ArXiv',
      tags: ['Fine-Tuning', 'PEFT', 'LoRA'],
    }
  ];

  for (const paper of papers) {
    await prisma.learning_resources.upsert({
      where: { external_url: paper.external_url },
      update: {},
      create: paper,
    });
  }

  // Create YouTube Courses
  const youtubeCourses = [
    {
      title: 'Neural Networks: Zero to Hero',
      author_or_creator: 'Andrej Karpathy',
      type: 'youtube_video' as const,
      description: 'A course by Andrej Karpathy on building neural networks, from scratch, in code.',
      external_url: 'https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ',
      platform_name: 'YouTube',
      tags: ['Neural Networks', 'PyTorch', 'From Scratch'],
      is_free: true,
    }
  ];

  for (const course of youtubeCourses) {
    await prisma.learning_resources.upsert({
      where: { external_url: course.external_url },
      update: {},
      create: course,
    });
  }

  // console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
