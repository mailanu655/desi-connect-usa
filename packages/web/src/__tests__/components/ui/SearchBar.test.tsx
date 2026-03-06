import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '@/components/ui/SearchBar';

describe('SearchBar', () => {
  it('renders input with correct placeholder', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} placeholder="Find businesses..." />);
    
    const input = screen.getByPlaceholderText('Find businesses...');
    expect(input).toBeInTheDocument();
  });

  it('renders input with default placeholder when not provided', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
    
    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });

  it('renders search icon', () => {
    const onSearch = jest.fn();
    const { container } = render(<SearchBar onSearch={onSearch} />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.tagName).toBe('svg');
  });

  it('calls onSearch with debounced value when user types', async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} debounceMs={300} />);
    
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'restaurant');
    
    // Wait for debounce
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalled();
    }, { timeout: 1000 });
    
    expect(onSearch).toHaveBeenCalledWith('restaurant');
  });

  it('does not call onSearch immediately (debounce behavior)', async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} debounceMs={300} />);
    
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'r');
    
    // Immediately check - should not have called onSearch yet
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('handles multiple calls to onSearch with each debounce cycle', async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} debounceMs={300} />);
    
    const input = screen.getByPlaceholderText('Search...');
    
    // Type first character
    await user.type(input, 'r');
    
    // Wait for first debounce
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('r');
    }, { timeout: 1000 });
    
    // Type second character
    await user.type(input, 'e');
    
    // Wait for second debounce
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('re');
    }, { timeout: 1000 });
  });

  it('handles empty search input', async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} debounceMs={300} />);
    
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test');
    
    // Wait for debounce
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test');
    }, { timeout: 1000 });
    
    // Clear the input
    await user.clear(input);
    
    // Wait for debounce
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('');
    }, { timeout: 1000 });
  });

  it('updates input value on change', async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);
    
    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    await user.type(input, 'test query');
    
    expect(input.value).toBe('test query');
  });

  it('respects custom debounce timing', async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} debounceMs={100} />);
    
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'query');
    
    // Wait for short debounce
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('query');
    }, { timeout: 500 });
  });

  it('input is focused when typed', async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);
    
    const input = screen.getByPlaceholderText('Search...');
    await user.click(input);
    await user.type(input, 'test');
    
    expect(input).toHaveFocus();
  });
});
