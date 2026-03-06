import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryFilter, { Category } from '@/components/ui/CategoryFilter';

describe('CategoryFilter', () => {
  const mockCategories: ReadonlyArray<Category> = [
    { value: 'restaurant', label: 'Restaurants', icon: '🍛' },
    { value: 'grocery', label: 'Grocery Stores', icon: '🛒' },
    { value: 'temple', label: 'Temples & Religious', icon: '🛕' },
  ];

  it('renders all category buttons', () => {
    const onSelect = jest.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        showAllOption={false}
      />
    );

    expect(screen.getByRole('button', { name: /Restaurants/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Grocery Stores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Temples & Religious/i })).toBeInTheDocument();
  });

  it('renders "All" option when showAllOption is true', () => {
    const onSelect = jest.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        showAllOption={true}
      />
    );

    expect(screen.getByRole('button', { name: /^All$/i })).toBeInTheDocument();
  });

  it('does not render "All" option when showAllOption is false', () => {
    const onSelect = jest.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        showAllOption={false}
      />
    );

    const allButtons = screen.queryAllByRole('button');
    const hasAllButton = allButtons.some(btn => btn.textContent?.trim() === 'All');
    expect(hasAllButton).toBe(false);
  });

  it('highlights active category using selectedCategory prop', () => {
    const onSelect = jest.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        selectedCategory="restaurant"
        showAllOption={false}
      />
    );

    const restaurantButton = screen.getByRole('button', { name: /Restaurants/i });
    expect(restaurantButton).toHaveClass('bg-saffron-500');
  });

  it('highlights active category using selected prop when provided', () => {
    const onSelect = jest.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        selected="grocery"
        showAllOption={false}
      />
    );

    const groceryButton = screen.getByRole('button', { name: /Grocery Stores/i });
    expect(groceryButton).toHaveClass('bg-saffron-500');
  });

  it('prefers selected prop over selectedCategory prop', () => {
    const onSelect = jest.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        selectedCategory="restaurant"
        selected="grocery"
        showAllOption={false}
      />
    );

    const groceryButton = screen.getByRole('button', { name: /Grocery Stores/i });
    const restaurantButton = screen.getByRole('button', { name: /Restaurants/i });

    expect(groceryButton).toHaveClass('bg-saffron-500');
    expect(restaurantButton).not.toHaveClass('bg-saffron-500');
  });

  it('calls onSelect when clicking a category', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        showAllOption={false}
      />
    );

    const restaurantButton = screen.getByRole('button', { name: /Restaurants/i });
    await user.click(restaurantButton);

    expect(onSelect).toHaveBeenCalledWith('restaurant');
  });

  it('calls onSelect with empty string when clicking "All"', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        showAllOption={true}
      />
    );

    const allButton = screen.getByRole('button', { name: /^All$/i });
    await user.click(allButton);

    expect(onSelect).toHaveBeenCalledWith('');
  });

  it('handles ReadonlyArray categories correctly', () => {
    const onSelect = jest.fn();
    const readonlyCategories = [
      { value: 'test1', label: 'Test 1', icon: '🏠' },
      { value: 'test2', label: 'Test 2', icon: '🚗' },
    ] as const;

    render(
      <CategoryFilter
        categories={readonlyCategories}
        onSelect={onSelect}
        showAllOption={false}
      />
    );

    expect(screen.getByRole('button', { name: /Test 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Test 2/i })).toBeInTheDocument();
  });

  it('renders category labels correctly', () => {
    const onSelect = jest.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        showAllOption={false}
      />
    );

    expect(screen.getByText('Restaurants')).toBeInTheDocument();
    expect(screen.getByText('Grocery Stores')).toBeInTheDocument();
    expect(screen.getByText('Temples & Religious')).toBeInTheDocument();
  });

  it('renders category icons when provided', () => {
    const onSelect = jest.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        showAllOption={false}
      />
    );

    expect(screen.getByText('🍛')).toBeInTheDocument();
    expect(screen.getByText('🛒')).toBeInTheDocument();
    expect(screen.getByText('🛕')).toBeInTheDocument();
  });

  it('calls onSelect multiple times when clicking different categories', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        showAllOption={false}
      />
    );

    const restaurantButton = screen.getByRole('button', { name: /Restaurants/i });
    const groceryButton = screen.getByRole('button', { name: /Grocery Stores/i });

    await user.click(restaurantButton);
    expect(onSelect).toHaveBeenCalledWith('restaurant');

    await user.click(groceryButton);
    expect(onSelect).toHaveBeenCalledWith('grocery');

    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('shows scroll buttons', () => {
    const onSelect = jest.fn();
    render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        showAllOption={false}
      />
    );

    const scrollButtons = screen.getAllByRole('button');
    // Should have scroll buttons + category buttons
    expect(scrollButtons.length).toBeGreaterThanOrEqual(mockCategories.length + 2);
  });

  it('default selectedCategory is empty string', () => {
    const onSelect = jest.fn();
    const { container } = render(
      <CategoryFilter
        categories={mockCategories}
        onSelect={onSelect}
        showAllOption={true}
      />
    );

    const allButton = screen.getByRole('button', { name: /^All$/i });
    expect(allButton).toHaveClass('bg-saffron-500');
  });
});
