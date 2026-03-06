import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ExportButton from '@/components/admin/ExportButton';

describe('ExportButton', () => {
  const origCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    // Mock document.createElement for the download link
    const createElementMock = jest.spyOn(document, 'createElement');
    createElementMock.mockImplementation((tag: string) => {
      if (tag === 'a') {
        const link = origCreateElement('a');
        link.click = jest.fn();
        return link;
      }
      return origCreateElement(tag);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the export button with correct text', () => {
    const mockGetData = jest.fn().mockResolvedValue([]);
    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
        label="Export Data"
      />
    );

    const button = screen.getByTestId('export-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Export Data');
  });

  it('renders with default label when not provided', () => {
    const mockGetData = jest.fn().mockResolvedValue([]);
    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    expect(button).toHaveTextContent('Export CSV');
  });

  it('calls getData when clicked', async () => {
    const mockGetData = jest.fn().mockResolvedValue([
      ['value1', 'value2'],
    ]);

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
    });
  });

  it('creates a CSV with proper headers', async () => {
    const mockGetData = jest.fn().mockResolvedValue([
      ['value1', 'value2'],
      ['value3', 'value4'],
    ]);

    const createElementSpy = jest.spyOn(document, 'createElement');
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
    });

    // Verify that blob was created with correct CSV content
    const blobCalls = (global.URL.createObjectURL as jest.Mock).mock.calls;
    expect(blobCalls.length).toBeGreaterThan(0);

    const blob = blobCalls[0][0];
    const reader = new FileReader();
    const csvContent = await new Promise<string>((resolve) => {
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsText(blob);
    });

    expect(csvContent).toMatch(/^Column 1,Column 2\n/);
    expect(csvContent).toContain('value1,value2');
    expect(csvContent).toContain('value3,value4');
  });

  it('handles data with commas by escaping properly', async () => {
    const mockGetData = jest.fn().mockResolvedValue([
      ['value, with comma', 'normal'],
    ]);

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
    });

    const blobCalls = (global.URL.createObjectURL as jest.Mock).mock.calls;
    const blob = blobCalls[0][0];
    const reader = new FileReader();
    const csvContent = await new Promise<string>((resolve) => {
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsText(blob);
    });

    expect(csvContent).toContain('"value, with comma"');
  });

  it('handles data with quotes by escaping properly', async () => {
    const mockGetData = jest.fn().mockResolvedValue([
      ['value with "quotes"', 'normal'],
    ]);

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
    });

    const blobCalls = (global.URL.createObjectURL as jest.Mock).mock.calls;
    const blob = blobCalls[0][0];
    const reader = new FileReader();
    const csvContent = await new Promise<string>((resolve) => {
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsText(blob);
    });

    // Double quotes should be escaped as ""
    expect(csvContent).toContain('"value with ""quotes"""');
  });

  it('handles data with newlines by escaping properly', async () => {
    const mockGetData = jest.fn().mockResolvedValue([
      ['value\nwith\nnewlines', 'normal'],
    ]);

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
    });

    const blobCalls = (global.URL.createObjectURL as jest.Mock).mock.calls;
    const blob = blobCalls[0][0];
    const reader = new FileReader();
    const csvContent = await new Promise<string>((resolve) => {
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsText(blob);
    });

    expect(csvContent).toContain('"value\nwith\nnewlines"');
  });

  it('shows loading state while exporting', async () => {
    const mockGetData = jest.fn(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 200))
    );

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    // Check that "Exporting..." appears while loading
    expect(screen.getByText('Exporting...')).toBeInTheDocument();

    // Wait for export to complete
    await waitFor(() => {
      expect(screen.queryByText('Exporting...')).not.toBeInTheDocument();
    });
  });

  it('disables button while exporting', async () => {
    const mockGetData = jest.fn(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 200))
    );

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');

    // Button should not be disabled initially
    expect(button).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(button);
    });

    // Button should be disabled while exporting
    expect(button).toBeDisabled();

    // Wait for export to complete
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('handles empty data gracefully', async () => {
    const mockGetData = jest.fn().mockResolvedValue([]);

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
    });

    const blobCalls = (global.URL.createObjectURL as jest.Mock).mock.calls;
    const blob = blobCalls[0][0];
    const reader = new FileReader();
    const csvContent = await new Promise<string>((resolve) => {
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsText(blob);
    });

    // Should only have headers, no data rows
    expect(csvContent).toBe('Column 1,Column 2');
  });

  it('handles getData rejection gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockGetData = jest.fn().mockRejectedValue(new Error('Fetch failed'));

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Export failed:',
        expect.any(Error)
      );
    });

    // Button should be re-enabled after error
    expect(button).not.toBeDisabled();

    consoleErrorSpy.mockRestore();
  });

  it('creates proper filename with date', async () => {
    const mockGetData = jest.fn().mockResolvedValue([]);

    // Mock the date to be consistent
    const mockDate = new Date('2024-03-15T10:30:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);

    const createElementSpy = jest.spyOn(document, 'createElement');
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
        filename="mydata"
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
    });

    // Check that the link was created with the correct filename
    const aElements = createElementSpy.mock.results.filter(
      (result) => result.value.tagName === 'A'
    );

    expect(aElements.length).toBeGreaterThan(0);
    const linkElement = aElements[aElements.length - 1].value as HTMLAnchorElement;
    expect(linkElement.download).toBe('mydata-2024-03-15.csv');

    jest.useRealTimers();
  });

  it('revokes blob URL after download', async () => {
    const mockGetData = jest.fn().mockResolvedValue([
      ['value1', 'value2'],
    ]);

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
    });

    // Verify URL.revokeObjectURL was called
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('accepts synchronous getData', async () => {
    const mockGetData = jest.fn().mockReturnValue([
      ['value1', 'value2'],
    ]);

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
    });

    const blobCalls = (global.URL.createObjectURL as jest.Mock).mock.calls;
    expect(blobCalls.length).toBeGreaterThan(0);
  });

  it('applies custom className when provided', () => {
    const mockGetData = jest.fn().mockResolvedValue([]);
    const customClass = 'custom-button-class';

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
        className={customClass}
      />
    );

    const button = screen.getByTestId('export-button');
    expect(button).toHaveClass(customClass);
  });

  it('uses default className when not provided', () => {
    const mockGetData = jest.fn().mockResolvedValue([]);

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    expect(button).toHaveClass('inline-flex');
    expect(button).toHaveClass('items-center');
    expect(button).toHaveClass('gap-2');
  });

  it('handles headers with special characters', async () => {
    const mockGetData = jest.fn().mockResolvedValue([
      ['value1', 'value2'],
    ]);

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column, 1', 'Column "2"']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
    });

    const blobCalls = (global.URL.createObjectURL as jest.Mock).mock.calls;
    const blob = blobCalls[0][0];
    const reader = new FileReader();
    const csvContent = await new Promise<string>((resolve) => {
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsText(blob);
    });

    // Headers should be properly escaped
    expect(csvContent).toContain('"Column, 1"');
    expect(csvContent).toContain('"Column ""2"""');
  });

  it('appends and removes link element from DOM', async () => {
    const mockGetData = jest.fn().mockResolvedValue([
      ['value1', 'value2'],
    ]);

    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
    });

    // Verify link was appended and removed
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('triggers click on the download link', async () => {
    const mockGetData = jest.fn().mockResolvedValue([
      ['value1', 'value2'],
    ]);

    const createElementSpy = jest.spyOn(document, 'createElement');

    render(
      <ExportButton
        getData={mockGetData}
        headers={['Column 1', 'Column 2']}
      />
    );

    const button = screen.getByTestId('export-button');
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalled();
    });

    // Find the link element and verify click was called
    const aElements = createElementSpy.mock.results.filter(
      (result) => result.value.tagName === 'A'
    );

    expect(aElements.length).toBeGreaterThan(0);
    const linkElement = aElements[aElements.length - 1].value as any;
    expect(linkElement.click).toHaveBeenCalled();
  });
});
