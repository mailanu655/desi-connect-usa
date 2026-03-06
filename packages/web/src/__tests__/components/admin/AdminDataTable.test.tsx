import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminDataTable from '@/components/admin/AdminDataTable';
import type { Column } from '@/components/admin/AdminDataTable';

interface TestItem {
  id: string;
  name: string;
  email: string;
  status: string;
}

const mockData: TestItem[] = [
  { id: '1', name: 'Alice', email: 'alice@test.com', status: 'active' },
  { id: '2', name: 'Bob', email: 'bob@test.com', status: 'inactive' },
  { id: '3', name: 'Charlie', email: 'charlie@test.com', status: 'active' },
];

const columns: Column<TestItem>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'status', header: 'Status' },
];

describe('AdminDataTable', () => {
  it('renders table headers', () => {
    render(
      <AdminDataTable
        columns={columns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(
      <AdminDataTable
        columns={columns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders custom column renderers', () => {
    const customColumns: Column<TestItem>[] = [
      { key: 'name', header: 'Name' },
      {
        key: 'status',
        header: 'Status',
        render: (item) => (
          <span data-testid={`status-${item.id}`} className={item.status === 'active' ? 'text-green-600' : 'text-red-600'}>
            {item.status.toUpperCase()}
          </span>
        ),
      },
    ];

    render(
      <AdminDataTable
        columns={customColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    );

    expect(screen.getByTestId('status-1')).toHaveTextContent('ACTIVE');
    expect(screen.getByTestId('status-2')).toHaveTextContent('INACTIVE');
  });

  it('shows loading state', () => {
    render(
      <AdminDataTable
        columns={columns}
        data={[]}
        keyExtractor={(item) => item.id}
        loading={true}
      />
    );

    // Should show loading spinner/indicator
    const loadingEl = document.querySelector('[class*="animate-spin"]');
    expect(loadingEl).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    render(
      <AdminDataTable
        columns={columns}
        data={[]}
        keyExtractor={(item) => item.id}
        emptyMessage="No items found."
      />
    );

    expect(screen.getByText('No items found.')).toBeInTheDocument();
  });

  it('shows default empty message when none provided', () => {
    render(
      <AdminDataTable
        columns={columns}
        data={[]}
        keyExtractor={(item) => item.id}
      />
    );

    // Default empty message is 'No items found.'
    expect(screen.getByText('No items found.')).toBeInTheDocument();
  });

  it('handles row click callback', () => {
    const onRowClick = jest.fn();

    render(
      <AdminDataTable
        columns={columns}
        data={mockData}
        keyExtractor={(item) => item.id}
        onRowClick={onRowClick}
      />
    );

    const firstRow = screen.getByText('Alice').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);
      expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
    }
  });

  it('renders correct number of rows', () => {
    render(
      <AdminDataTable
        columns={columns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    );

    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('renders correct number of columns per row', () => {
    render(
      <AdminDataTable
        columns={columns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    );

    const headerCells = document.querySelectorAll('thead th');
    expect(headerCells.length).toBe(3);
  });
});
