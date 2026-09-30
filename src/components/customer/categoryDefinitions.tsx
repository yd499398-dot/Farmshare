import React from 'react';
import {
  Tractor,
  Truck,
  Wheat,
  Wrench,
  Trees,
  Warehouse,
  Droplets,
  Plane,
  Layers
} from 'lucide-react';
import { ListingCategory } from '../../types/marketplace';

export const CATEGORY_DEFINITIONS: Array<{
  category: ListingCategory;
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
}> = [
  {
    category: 'Tractors',
    title: 'Tractors',
    description: '25 HP to 75+ HP utility & 4WD tractors',
    icon: <Tractor size={22} className="text-emerald-700" />,
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'Farm Vehicles',
    title: 'Farm Vehicles',
    description: 'Pickups, trailers, and cargo carriers',
    icon: <Truck size={22} className="text-emerald-700" />,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'Harvesting Equipment',
    title: 'Harvesting Equipment',
    description: 'Combine harvesters, threshers & cutters',
    icon: <Wheat size={22} className="text-emerald-700" />,
    image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'Agricultural Machinery',
    title: 'Agricultural Machinery',
    description: 'Rotavators, disc harrows & seeders',
    icon: <Wrench size={22} className="text-emerald-700" />,
    image: 'https://images.unsplash.com/photo-1589923188651-268a9765e432?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'Tools & Equipment',
    title: 'Tools & Equipment',
    description: 'Power weeders, sprayers & augers',
    icon: <Layers size={22} className="text-emerald-700" />,
    image: 'https://images.unsplash.com/photo-1594771804886-a933bb2d609b?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'Land',
    title: 'Agricultural Land',
    description: 'Fertile plots, orchards & leased acres',
    icon: <Trees size={22} className="text-emerald-700" />,
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'Storage',
    title: 'Farm Storage',
    description: 'Solar cold rooms, silos & godowns',
    icon: <Warehouse size={22} className="text-emerald-700" />,
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'Irrigation Equipment',
    title: 'Irrigation Equipment',
    description: 'Solar pumps, drip lateral kits & sprinklers',
    icon: <Droplets size={22} className="text-emerald-700" />,
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'Farming Services',
    title: 'Farming Services',
    description: 'Drone spraying & certified operators',
    icon: <Plane size={22} className="text-emerald-700" />,
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80'
  }
];
