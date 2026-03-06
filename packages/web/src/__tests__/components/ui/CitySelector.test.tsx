import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CitySelector from '@/components/ui/CitySelector';
import { METRO_AREAS } from '@/lib/constants';

describe('CitySelector', () => {
  it('renders dropdown/select element', () => {
    const onSelect = jest.fn();
    render(<CitySelector value="" onSelect={onSelect} />);

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();
  });

  it('lists all 10 metro areas from constants', () => {
    const onSelect = jest.fn();
    render(<CitySelector value="" onSelect={onSelect} />);

    METRO_AREAS.forEach(area => {
      expect(screen.getByRole('option', { name: new RegExp(`${area.name}.*${area.state}`) })).toBeInTheDocument();
    });
  });

  it('should have exactly 10 metro areas plus All Cities option', () => {
    const onSelect = jest.fn();
    render(<CitySelector value="" onSelect={onSelect} />);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(METRO_AREAS.length + 1); // +1 for "All Cities"
  });

  it('shows "All Cities" as default option', () => {
    const onSelect = jest.fn();
    render(<CitySelector value="" onSelect={onSelect} />);

    const allCitiesOption = screen.getByRole('option', { name: /All Cities/i });
    expect(allCitiesOption).toBeInTheDocument();
  });

  it('displays city name with state', () => {
    const onSelect = jest.fn();
    render(<CitySelector value="" onSelect={onSelect} />);

    // Check a few specific cities
    expect(screen.getByRole('option', { name: /New York City, NY/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Bay Area, CA/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Dallas-Fort Worth, TX/i })).toBeInTheDocument();
  });

  it('calls onSelect when selecting a city', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(<CitySelector value="" onSelect={onSelect} />);

    const selectElement = screen.getByRole('combobox');
    await user.selectOptions(selectElement, 'nyc');

    expect(onSelect).toHaveBeenCalledWith('nyc');
  });

  it('calls onSelect with empty string when selecting "All Cities"', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(<CitySelector value="nyc" onSelect={onSelect} />);

    const selectElement = screen.getByRole('combobox');
    await user.selectOptions(selectElement, '');

    expect(onSelect).toHaveBeenCalledWith('');
  });

  it('sets correct value when selected prop is provided', () => {
    const onSelect = jest.fn();
    const { rerender } = render(<CitySelector value="nyc" onSelect={onSelect} />);

    const selectElement = screen.getByRole('combobox') as HTMLSelectElement;
    expect(selectElement.value).toBe('nyc');

    rerender(<CitySelector value="bay-area" onSelect={onSelect} />);
    expect(selectElement.value).toBe('bay-area');
  });

  it('shows "All Cities" as selected when value is empty string', () => {
    const onSelect = jest.fn();
    render(<CitySelector value="" onSelect={onSelect} />);

    const selectElement = screen.getByRole('combobox') as HTMLSelectElement;
    expect(selectElement.value).toBe('');
  });

  it('handles all metro area selections', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(<CitySelector value="" onSelect={onSelect} />);

    const selectElement = screen.getByRole('combobox');

    for (const area of METRO_AREAS) {
      await user.selectOptions(selectElement, area.slug);
      expect(onSelect).toHaveBeenCalledWith(area.slug);
    }
  });

  it('renders with full width class', () => {
    const onSelect = jest.fn();
    const { container } = render(<CitySelector value="" onSelect={onSelect} />);

    const wrapper = container.querySelector('.w-full');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders dropdown icon', () => {
    const onSelect = jest.fn();
    const { container } = render(<CitySelector value="" onSelect={onSelect} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('dropdown icon is not clickable (pointer-events-none)', () => {
    const onSelect = jest.fn();
    const { container } = render(<CitySelector value="" onSelect={onSelect} />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('pointer-events-none');
  });

  it('metro areas from constants are used', () => {
    const onSelect = jest.fn();
    render(<CitySelector value="" onSelect={onSelect} />);

    // Check that all metro areas have their slugs as option values
    METRO_AREAS.forEach(area => {
      const option = screen.getByRole('option', { 
        name: new RegExp(`${area.name}.*${area.state}`) 
      }) as HTMLOptionElement;
      expect(option.value).toBe(area.slug);
    });
  });

  it('maintains selection after rerender', () => {
    const onSelect = jest.fn();
    const { rerender } = render(<CitySelector value="chicago" onSelect={onSelect} />);

    let selectElement = screen.getByRole('combobox') as HTMLSelectElement;
    expect(selectElement.value).toBe('chicago');

    rerender(<CitySelector value="chicago" onSelect={onSelect} />);

    selectElement = screen.getByRole('combobox') as HTMLSelectElement;
    expect(selectElement.value).toBe('chicago');
  });

  it('can switch between different cities', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    const { rerender } = render(<CitySelector value="nyc" onSelect={onSelect} />);

    const selectElement = screen.getByRole('combobox') as HTMLSelectElement;
    expect(selectElement.value).toBe('nyc');

    await user.selectOptions(selectElement, 'bay-area');
    expect(onSelect).toHaveBeenCalledWith('bay-area');

    rerender(<CitySelector value="bay-area" onSelect={onSelect} />);
    expect(selectElement.value).toBe('bay-area');
  });
});
