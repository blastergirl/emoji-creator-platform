export interface LevelConfig {
  id: string;
  name: string;
  image: string;
  gridSize: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const levels: LevelConfig[] = [
  {
    id: 'sleepy-cat',
    name: 'Sleepy Cat',
    image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=600&fit=crop&crop=faces,center",
    gridSize: 2,
    difficulty: 'easy'
  },
  {
    id: 'kitten',
    name: 'Curious Kitten',
    image: "https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=600&h=600&fit=crop&crop=faces,center",
    gridSize: 2,
    difficulty: 'easy'
  },
  {
    id: 'orange-cat',
    name: 'Ginger Cat',
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=600&fit=crop&crop=faces,center",
    gridSize: 3,
    difficulty: 'medium'
  },
  {
    id: 'black-cat',
    name: 'Shadow Cat',
    image: "https://images.unsplash.com/photo-1557246565-8a3d3ab5d7f6?w=600&h=600&fit=crop&crop=faces,center",
    gridSize: 3,
    difficulty: 'medium'
  },
  {
    id: 'grumpy-cat',
    name: 'Grumpy Cat',
    image: "https://images.unsplash.com/photo-1569591159212-b02ea8a9f239?w=600&h=600&fit=crop&crop=faces,center",
    gridSize: 3,
    difficulty: 'medium'
  },
  {
    id: 'white-cat',
    name: 'Snow Cat',
    image: "https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=600&h=600&fit=crop&crop=faces,center",
    gridSize: 4,
    difficulty: 'hard'
  },
  {
    id: 'tiger-cat',
    name: 'Tiger Cat',
    image: "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600&h=600&fit=crop&crop=faces,center",
    gridSize: 4,
    difficulty: 'hard'
  },
  {
    id: 'siamese-cat',
    name: 'Siamese Cat',
    image: "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=600&h=600&fit=crop&crop=faces,center",
    gridSize: 4,
    difficulty: 'hard'
  },
  {
    id: 'expert-cat',
    name: 'Expert Cat',
    image: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&h=600&fit=crop&crop=faces,center",
    gridSize: 5,
    difficulty: 'hard'
  }
]; 