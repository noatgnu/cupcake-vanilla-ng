import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CUPCAKE_CORE_CONFIG, ResourceVisibility } from '@noatgnu/cupcake-core';
import { MetadataTableService } from './metadata-table';
import { MetadataTableTemplateService } from './metadata-table-template';
import { MetadataColumnTemplateService } from './metadata-column-template';

const API = 'http://localhost:8000/api/v1';

describe('Requests sent to the CUPCAKE Vanilla backend', () => {
  let httpMock: HttpTestingController;
  let tables: MetadataTableService;
  let templates: MetadataTableTemplateService;
  let columnTemplates: MetadataColumnTemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: API } }
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
    tables = TestBed.inject(MetadataTableService);
    templates = TestBed.inject(MetadataTableTemplateService);
    columnTemplates = TestBed.inject(MetadataColumnTemplateService);
  });

  afterEach(() => httpMock.verify());

  function expectRequest(method: string, url: string, body: unknown, response: object = {}) {
    const req = httpMock.expectOne(`${API}${url}`);
    expect(req.request.method).toBe(method);
    expect(req.request.body).toEqual(body);
    req.flush(response);
  }

  describe('metadata tables', () => {
    it('combines tables column-wise with the source tables and target name', () => {
      tables.combineColumnwise({ sourceTableIds: [1, 2], targetName: 'combined', applySchemaReordering: false })
        .subscribe(result => expect(result.combinedTable.id).toBe(9));
      expectRequest('POST', '/metadata-tables/combine_columnwise/',
        { source_table_ids: [1, 2], target_name: 'combined', apply_schema_reordering: false },
        { message: 'ok', combined_table: { id: 9 } });
    });

    it('combines tables row-wise with the merge strategy', () => {
      tables.combineRowwise({ sourceTableIds: [1, 2], targetName: 'stacked', mergeStrategy: 'intersection' }).subscribe();
      expectRequest('POST', '/metadata-tables/combine_rowwise/',
        { source_table_ids: [1, 2], target_name: 'stacked', merge_strategy: 'intersection' });
    });

    it('sends the autofill specification in snake_case', () => {
      tables.advancedAutofill(4, {
        templateSamples: [1],
        targetSampleCount: 6,
        variations: [{ columnId: 7, type: 'range', start: 1, end: 6 }],
        fillStrategy: 'sequential'
      }).subscribe(result => expect(result.samplesModified).toBe(6));
      expectRequest('POST', '/metadata-tables/4/advanced_autofill/', {
        template_samples: [1],
        target_sample_count: 6,
        variations: [{ column_id: 7, type: 'range', start: 1, end: 6 }],
        fill_strategy: 'sequential'
      }, { status: 'success', samples_modified: 6, columns_modified: 1, variations_combinations: 6, strategy: 'sequential' });
    });
  });

  describe('metadata table templates', () => {
    it('creates a template from schemas with the lab group id and visibility', () => {
      templates.createFromSchema({
        name: 'shared',
        schemaIds: [3],
        labGroupId: 5,
        visibility: ResourceVisibility.GROUP,
        isDefault: false
      }).subscribe(template => expect(template.name).toBe('shared'));
      expectRequest('POST', '/metadata-table-templates/create_from_schema/',
        { name: 'shared', schema_ids: [3], lab_group_id: 5, visibility: 'group', is_default: false },
        { id: 1, name: 'shared', is_default: false });
    });

    it('creates a table from a template with the lab group id', () => {
      templates.createTableFromTemplate({ templateId: 2, name: 'table', sampleCount: 4, labGroupId: 5 }).subscribe();
      expectRequest('POST', '/metadata-table-templates/create_table_from_template/',
        { template_id: 2, name: 'table', sample_count: 4, lab_group_id: 5 });
    });

    it('creates a table from schemas with the lab group id', () => {
      templates.createTableFromSchemas({ schemaIds: [3], name: 'table', sampleCount: 2, labGroupId: 5 }).subscribe();
      expectRequest('POST', '/metadata-table-templates/create_table_from_schemas/',
        { schema_ids: [3], name: 'table', sample_count: 2, lab_group_id: 5 });
    });

    it('adds, removes and reorders template columns by column id', () => {
      templates.addColumn(1, { columnData: { name: 'organism' }, position: 2 }).subscribe();
      expectRequest('POST', '/metadata-table-templates/1/add_column/', { column_data: { name: 'organism' }, position: 2 });
      templates.removeColumn(1, { columnId: 8 }).subscribe();
      expectRequest('POST', '/metadata-table-templates/1/remove_column/', { column_id: 8 });
      templates.reorderColumn(1, { columnId: 8, newPosition: 0 }).subscribe();
      expectRequest('POST', '/metadata-table-templates/1/reorder_column/', { column_id: 8, new_position: 0 });
    });

    it('duplicates a column and reads back the new column', () => {
      templates.duplicateColumn(1, { columnId: 8, newName: 'copy' })
        .subscribe(result => expect(result.column.id).toBe(9));
      expectRequest('POST', '/metadata-table-templates/1/duplicate_column/', { column_id: 8, new_name: 'copy' },
        { message: 'ok', column: { id: 9 } });
    });

    it('applies a template to a table and reads back the created columns', () => {
      templates.applyToMetadataTable(1, { metadataTableId: 4 })
        .subscribe(result => expect(result.createdColumns.length).toBe(1));
      expectRequest('POST', '/metadata-table-templates/1/apply_to_metadata_table/', { metadata_table_id: 4 },
        { message: 'ok', created_columns: [{ id: 3 }] });
    });

    it('sends field masks as field_mask_mapping without changing the column names', () => {
      templates.updateFieldMask(1, { 'characteristics[organism]': 'Organism' })
        .subscribe(result => expect(result.fieldMaskMapping).toBeDefined());
      expectRequest('POST', '/metadata-table-templates/1/update_field_mask/',
        { field_mask_mapping: { 'characteristics[organism]': 'Organism' } },
        { message: 'ok', field_mask_mapping: {} });
    });

    it('reads the field mask of a template', () => {
      templates.getFieldMask(1).subscribe(result => {
        expect(result.templateId).toBe(1);
        expect(result.templateName).toBe('t');
      });
      const req = httpMock.expectOne(`${API}/metadata-table-templates/1/get_field_mask/`);
      req.flush({ field_mask_mapping: {}, template_name: 't', template_id: 1 });
    });
  });

  describe('column templates', () => {
    it('creates a column from a template at a position', () => {
      columnTemplates.createMetadataColumn(1, { metadataTableId: 4, position: 2 })
        .subscribe(result => expect(result.columnId).toBe(11));
      expectRequest('POST', '/column-templates/1/create_metadata_column/', { metadata_table_id: 4, position: 2 },
        { message: 'ok', column_id: 11, template_usage_count: 1 });
    });

    it('shares a template with a user and a permission level', () => {
      columnTemplates.shareTemplate(1, { userId: 6, permissionLevel: 'edit' }).subscribe();
      expectRequest('POST', '/column-templates/1/share_template/', { user_id: 6, permission_level: 'edit' });
    });

    it('sends the user id when removing a share', () => {
      columnTemplates.unshareTemplate(1, { userId: 6 }).subscribe();
      expectRequest('DELETE', '/column-templates/1/unshare_template/', { user_id: 6 });
    });
  });
});
