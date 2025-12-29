import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardComponent } from './dashboard.component';
import { BirthdayFacadeService, CategoryFacadeService } from '../../../core';
import { BirthdayEditService, BirthdayStatsService, CategoryManagerService } from '../services';
import { Birthday, BirthdayCategory } from '../../../shared';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let birthdayFacadeSpy: jasmine.SpyObj<BirthdayFacadeService>;
  let categoryFacadeSpy: jasmine.SpyObj<CategoryFacadeService>;
  let editServiceSpy: jasmine.SpyObj<BirthdayEditService>;
  let statsServiceSpy: jasmine.SpyObj<BirthdayStatsService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let categoryManagerSpy: jasmine.SpyObj<CategoryManagerService>;

  const mockBirthdays: Birthday[] = [
    {
      id: '1',
      name: 'John Doe',
      birthDate: new Date(1990, 0, 15),
      category: 'friends',
      zodiacSign: 'Capricorn',
      reminderDays: 7,
      notes: '',
      scheduledMessages: []
    },
    {
      id: '2',
      name: 'Jane Smith',
      birthDate: new Date(1985, 5, 20),
      category: 'family',
      zodiacSign: 'Gemini',
      reminderDays: 7,
      notes: '',
      scheduledMessages: []
    }
  ];

  const mockCategories: BirthdayCategory[] = [
    { id: 'friends', name: 'Friends', icon: 'group', color: '#4CAF50' },
    { id: 'family', name: 'Family', icon: 'family_restroom', color: '#2196F3' }
  ];

  const mockNext5Birthdays = [
    { ...mockBirthdays[0], nextBirthday: new Date(2026, 0, 15), daysUntil: 10 },
    { ...mockBirthdays[1], nextBirthday: new Date(2026, 5, 20), daysUntil: 20 }
  ];

  beforeEach(async () => {
    const birthdayFacadeSpyObj = jasmine.createSpyObj('BirthdayFacadeService', [
      'loadTestData',
      'clearAllBirthdays',
      'addBirthday',
      'getBirthdaysNext30Days'
    ], {
      birthdays$: of(mockBirthdays),
      birthdays: jasmine.createSpy('birthdays').and.returnValue(mockBirthdays),
      averageAge$: of(30),
      averageAge: jasmine.createSpy('averageAge').and.returnValue(30),
      next5Birthdays$: of(mockNext5Birthdays),
      next5Birthdays: jasmine.createSpy('next5Birthdays').and.returnValue(mockNext5Birthdays)
    });
    const categoryFacadeSpyObj = jasmine.createSpyObj('CategoryFacadeService', [], {
      categories$: of(mockCategories),
      categories: jasmine.createSpy('categories').and.returnValue(mockCategories)
    });
    const editServiceSpyObj = jasmine.createSpyObj('BirthdayEditService', ['cancelEdit'], {
      currentEditingId: null
    });
    const statsServiceSpyObj = jasmine.createSpyObj('BirthdayStatsService', [
      'getChartData',
      'getMaxCount',
      'getCategoriesStats'
    ]);
    const dialogSpyObj = jasmine.createSpyObj('MatDialog', ['open']);
    const categoryManagerSpyObj = jasmine.createSpyObj('CategoryManagerService', [
      'addCategory',
      'editCategory',
      'deleteCategory'
    ]);

    birthdayFacadeSpyObj.getBirthdaysNext30Days.and.returnValue(of(mockBirthdays));

    statsServiceSpyObj.getChartData.and.returnValue([
      { month: 0, count: 1 },
      { month: 1, count: 0 }
    ]);
    statsServiceSpyObj.getMaxCount.and.returnValue(1);
    statsServiceSpyObj.getCategoriesStats.and.returnValue([
      { categoryId: 'friends', count: 1 },
      { categoryId: 'family', count: 1 }
    ]);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, NoopAnimationsModule],
      providers: [
        { provide: BirthdayFacadeService, useValue: birthdayFacadeSpyObj },
        { provide: CategoryFacadeService, useValue: categoryFacadeSpyObj },
        { provide: BirthdayEditService, useValue: editServiceSpyObj },
        { provide: BirthdayStatsService, useValue: statsServiceSpyObj },
        { provide: MatDialog, useValue: dialogSpyObj },
        { provide: CategoryManagerService, useValue: categoryManagerSpyObj }
      ]
    }).compileComponents();

    birthdayFacadeSpy = TestBed.inject(BirthdayFacadeService) as jasmine.SpyObj<BirthdayFacadeService>;
    categoryFacadeSpy = TestBed.inject(CategoryFacadeService) as jasmine.SpyObj<CategoryFacadeService>;
    editServiceSpy = TestBed.inject(BirthdayEditService) as jasmine.SpyObj<BirthdayEditService>;
    statsServiceSpy = TestBed.inject(BirthdayStatsService) as jasmine.SpyObj<BirthdayStatsService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    categoryManagerSpy = TestBed.inject(CategoryManagerService) as jasmine.SpyObj<CategoryManagerService>;

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Signals initialization', () => {
    it('should initialize totalBirthdays', () => {
      expect(component.totalBirthdays()).toBe(2);
    });

    it('should initialize birthdaysThisMonth', () => {
      expect(component.birthdaysThisMonth()).toBeGreaterThanOrEqual(0);
    });

    it('should initialize averageAge', () => {
      expect(component.averageAge()).toBe(30);
    });

    it('should initialize nextBirthdayDays', () => {
      expect(component.nextBirthdayDays()).toBe(10);
    });

    it('should return "Today!" when next birthday is today', () => {
      const birthdaysToday = [{ ...mockBirthdays[0], nextBirthday: new Date(), daysUntil: 0 }];
      (birthdayFacadeSpy.next5Birthdays as jasmine.Spy).and.returnValue(birthdaysToday);
      const comp = new DashboardComponent(
        birthdayFacadeSpy,
        categoryFacadeSpy,
        editServiceSpy,
        statsServiceSpy,
        dialogSpy,
        categoryManagerSpy
      );
      expect(comp.nextBirthdayText()).toBe('Today!');
    });

    it('should return "Tomorrow!" when next birthday is tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const birthdaysTomorrow = [{ ...mockBirthdays[0], nextBirthday: tomorrow, daysUntil: 1 }];
      (birthdayFacadeSpy.next5Birthdays as jasmine.Spy).and.returnValue(birthdaysTomorrow);
      const comp = new DashboardComponent(
        birthdayFacadeSpy,
        categoryFacadeSpy,
        editServiceSpy,
        statsServiceSpy,
        dialogSpy,
        categoryManagerSpy
      );
      expect(comp.nextBirthdayText()).toBe('Tomorrow!');
    });

    it('should return "N/A" when no birthdays', () => {
      (birthdayFacadeSpy.next5Birthdays as jasmine.Spy).and.returnValue([]);
      const comp = new DashboardComponent(
        birthdayFacadeSpy,
        categoryFacadeSpy,
        editServiceSpy,
        statsServiceSpy,
        dialogSpy,
        categoryManagerSpy
      );
      expect(comp.nextBirthdayText()).toBe('N/A');
    });
  });

  describe('Category management', () => {
    it('should select a category', () => {
      component.selectCategory('friends');
      expect(component.selectedCategory).toBe('friends');
    });

    it('should deselect category if already selected', () => {
      component.selectCategory('friends');
      component.selectCategory('friends');
      expect(component.selectedCategory).toBeNull();
    });

    it('should clear category filter', () => {
      component.selectedCategory = 'friends';
      component.clearCategoryFilter();
      expect(component.selectedCategory).toBeNull();
    });

    it('should add category', () => {
      component.onAddCategory();
      expect(categoryManagerSpy.addCategory).toHaveBeenCalled();
    });

    it('should edit category', () => {
      component.onEditCategory('friends');
      expect(categoryManagerSpy.editCategory).toHaveBeenCalledWith('friends');
    });

    it('should delete category', () => {
      component.onDeleteCategory('friends');
      expect(categoryManagerSpy.deleteCategory).toHaveBeenCalledWith('friends');
    });

    it('should check if category is selected', () => {
      component.selectedCategory = 'friends';
      expect(component.isCategorySelected('friends')).toBeTrue();
      expect(component.isCategorySelected('family')).toBeFalse();
    });
  });

  describe('Search functionality', () => {
    it('should update search term', () => {
      component.onSearchTermChange('John');
      expect(component.dashboardSearchTerm).toBe('John');
    });

    it('should clear search term', () => {
      component.dashboardSearchTerm = 'John';
      component.onClearSearch();
      expect(component.dashboardSearchTerm).toBe('');
    });

    it('should filter birthdays by search term', () => {
      component.dashboardSearchTerm = 'John';
      fixture.detectChanges();
      const filtered = component.allBirthdays();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('John Doe');
    });

    it('should be case insensitive when filtering', () => {
      component.dashboardSearchTerm = 'john';
      fixture.detectChanges();
      const filtered = component.allBirthdays();
      expect(filtered.length).toBe(1);
    });
  });

  describe('Birthday filtering and sorting', () => {
    it('should return empty array when birthdays is null', () => {
      (birthdayFacadeSpy.birthdays as jasmine.Spy).and.returnValue(null);
      const comp = new DashboardComponent(
        birthdayFacadeSpy,
        categoryFacadeSpy,
        editServiceSpy,
        statsServiceSpy,
        dialogSpy,
        categoryManagerSpy
      );
      const result = comp.allBirthdays();
      expect(result).toEqual([]);
    });

    it('should filter by selected category', () => {
      component.selectedCategory = 'friends';
      fixture.detectChanges();
      const filtered = component.allBirthdays();
      expect(filtered.length).toBe(1);
      expect(filtered[0].category).toBe('friends');
    });

    it('should filter orphaned categories', () => {
      const birthdaysWithOrphaned = [
        ...mockBirthdays,
        {
          id: '3',
          name: 'Orphan',
          birthDate: new Date(2000, 0, 1),
          category: 'nonexistent',
          zodiacSign: 'Capricorn',
          reminderDays: 7,
          notes: '',
          scheduledMessages: []
        }
      ];
      (birthdayFacadeSpy.birthdays as jasmine.Spy).and.returnValue(birthdaysWithOrphaned);
      component.selectedCategory = '__orphaned__';
      fixture.detectChanges();
      const filtered = component.allBirthdays();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Orphan');
    });

    it('should sort birthdays by days until birthday', () => {
      const result = component.allBirthdays();
      expect(result.length).toBe(2);
    });
  });

  describe('Data management', () => {
    it('should load test data', () => {
      component.addTestData();
      expect(birthdayFacadeSpy.loadTestData).toHaveBeenCalled();
    });

    it('should clear all data', () => {
      component.lastAction = { type: 'delete', data: mockBirthdays[0] };
      component.clearAllData();
      expect(birthdayFacadeSpy.clearAllBirthdays).toHaveBeenCalled();
      expect(component.lastAction).toBeNull();
    });

    it('should undo last delete action', () => {
      component.lastAction = { type: 'delete', data: mockBirthdays[0] };
      component.undoLastAction();
      expect(birthdayFacadeSpy.addBirthday).toHaveBeenCalledWith(mockBirthdays[0]);
      expect(component.lastAction).toBeNull();
    });

    it('should not undo if no last action', () => {
      component.lastAction = null;
      component.undoLastAction();
      expect(birthdayFacadeSpy.addBirthday).not.toHaveBeenCalled();
    });

    it('should store deleted birthday in lastAction', () => {
      component.onBirthdayDeleted(mockBirthdays[0]);
      expect(component.lastAction).toEqual({
        type: 'delete',
        data: mockBirthdays[0]
      });
    });

    it('should add imported birthdays with 50ms delay', async () => {
      const birthdays = [mockBirthdays[0], mockBirthdays[1]];
      await component.onBirthdaysImported(birthdays);
      expect(birthdayFacadeSpy.addBirthday).toHaveBeenCalledTimes(2);
      expect(birthdayFacadeSpy.addBirthday).toHaveBeenCalledWith(mockBirthdays[0]);
      expect(birthdayFacadeSpy.addBirthday).toHaveBeenCalledWith(mockBirthdays[1]);
    });
  });

  describe('Message dialog', () => {
    it('should open message dialog', () => {
      component.openMessageDialog();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should blur button before opening dialog', () => {
      const button = document.createElement('button');
      spyOn(button, 'blur');
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: button, enumerable: true });

      component.openMessageDialog(event);
      expect(button.blur).toHaveBeenCalled();
    });
  });

  describe('Edit mode click handler', () => {
    it('should not cancel edit if no editing ID', () => {
      Object.defineProperty(editServiceSpy, 'currentEditingId', {
        get: () => null,
        configurable: true
      });
      const event = new MouseEvent('click');
      component.onDocumentClick(event);
      expect(editServiceSpy.cancelEdit).not.toHaveBeenCalled();
    });

    it('should cancel edit when clicking outside', () => {
      Object.defineProperty(editServiceSpy, 'currentEditingId', {
        get: () => '1',
        configurable: true
      });
      const div = document.createElement('div');
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: div, enumerable: true });

      component.onDocumentClick(event);
      expect(editServiceSpy.cancelEdit).toHaveBeenCalled();
    });
  });
});
